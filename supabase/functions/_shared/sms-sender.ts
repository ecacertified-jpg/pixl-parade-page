/**
 * Shared SMS Sender Module via Twilio
 * Centralizes all SMS sending logic with country-based routing
 */

// Types
export interface SmsResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  errorCode?: number;
  channel: 'sms' | 'whatsapp';
}

interface TwilioResponse {
  sid: string;
  status: string;
  error_code?: number;
  error_message?: string;
}

// Country prefixes with reliable SMS delivery
const SMS_RELIABLE_PREFIXES = ['+225', '+221']; // Côte d'Ivoire, Sénégal

/**
 * Determines the preferred notification channel based on phone prefix
 * SMS for reliable countries, WhatsApp for others
 */
export function getPreferredChannel(phone: string): 'sms' | 'whatsapp' {
  const cleanPhone = formatPhoneForTwilio(phone);
  
  for (const prefix of SMS_RELIABLE_PREFIXES) {
    if (cleanPhone.startsWith(prefix)) {
      return 'sms';
    }
  }
  
  return 'whatsapp';
}

/**
 * Formats a phone number to E.164 format for Twilio
 */
export function formatPhoneForTwilio(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Côte d'Ivoire - 10 chiffres (format post-2021: 0X XX XX XX XX)
    if (cleaned.length === 10 && /^0[157]/.test(cleaned)) {
      cleaned = '+225' + cleaned; // Keep the leading 0
    }
    // Ancien format CI - 8 chiffres (legacy)
    else if (cleaned.length === 8 && /^[0-9]/.test(cleaned)) {
      cleaned = '+225' + cleaned;
    }
    // Sénégal - 9 chiffres (7X XXX XX XX)
    else if (cleaned.length === 9 && /^7/.test(cleaned)) {
      cleaned = '+221' + cleaned;
    }
    // Autre - ajouter +
    else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Truncates a message to fit SMS character limits
 * Standard SMS: 160 chars, Unicode: 70 chars
 */
export function truncateMessage(message: string, maxLength: number = 160): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Builds the Basic Auth header for Twilio API
 */
function buildTwilioAuthHeader(accountSid: string, authToken: string): string {
  const credentials = `${accountSid}:${authToken}`;
  return 'Basic ' + btoa(credentials);
}

/**
 * Sends an SMS via Twilio using Alphanumeric Sender ID
 * @param to - Recipient phone number (E.164 format)
 * @param message - Message content (max 160 chars recommended)
 * @param options - Optional configuration
 * @returns SmsResult with success status and details
 */
export async function sendSms(
  to: string,
  message: string,
  options: { 
    truncate?: boolean;
    retryOnce?: boolean;
  } = {}
): Promise<SmsResult> {
  const { truncate = true, retryOnce = true } = options;
  
  // Get Twilio credentials from environment
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const senderId = Deno.env.get('TWILIO_SENDER_ID') || 'JoieDvivre';
  
  if (!accountSid || !authToken) {
    console.error('❌ [SMS] Twilio credentials not configured');
    return {
      success: false,
      error: 'TWILIO_CREDENTIALS_MISSING',
      channel: 'sms'
    };
  }
  
  const formattedPhone = formatPhoneForTwilio(to);
  if (!formattedPhone || formattedPhone.length < 10) {
    console.error('❌ [SMS] Invalid phone number:', to);
    return {
      success: false,
      error: 'INVALID_PHONE_NUMBER',
      channel: 'sms'
    };
  }
  
  const finalMessage = truncate ? truncateMessage(message) : message;
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('To', formattedPhone);
  formData.append('From', senderId);
  formData.append('Body', finalMessage);
  
  console.log(`📤 [SMS] Sending to ${formattedPhone.substring(0, 7)}***`);
  
  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': buildTwilioAuthHeader(accountSid, authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const data: TwilioResponse = await response.json();
    
    if (!response.ok) {
      console.error('❌ [SMS] Twilio error:', data.error_code, data.error_message);
      
      // Retry once if configured
      if (retryOnce && response.status >= 500) {
        console.log('🔄 [SMS] Retrying after server error...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return sendSms(to, message, { ...options, retryOnce: false });
      }
      
      return {
        success: false,
        error: data.error_message || `HTTP ${response.status}`,
        errorCode: data.error_code,
        channel: 'sms'
      };
    }
    
    console.log(`✅ [SMS] Sent successfully: ${data.sid}, status: ${data.status}`);
    
    return {
      success: true,
      sid: data.sid,
      status: data.status,
      channel: 'sms'
    };
    
  } catch (error) {
    console.error('❌ [SMS] Network error:', error);
    
    // Retry once on network errors
    if (retryOnce) {
      console.log('🔄 [SMS] Retrying after network error...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sendSms(to, message, { ...options, retryOnce: false });
    }
    
    return {
      success: false,
      error: error.message || 'NETWORK_ERROR',
      channel: 'sms'
    };
  }
}

/**
 * Sends notification via the preferred channel (SMS or WhatsApp)
 * Automatically routes based on phone prefix
 */
export async function sendNotification(
  to: string,
  message: string,
  options: {
    forceSms?: boolean;
    forceWhatsApp?: boolean;
    truncate?: boolean;
  } = {}
): Promise<SmsResult> {
  const { forceSms = false, forceWhatsApp = false, truncate = true } = options;
  
  let channel: 'sms' | 'whatsapp';
  
  if (forceSms) {
    channel = 'sms';
  } else if (forceWhatsApp) {
    channel = 'whatsapp';
  } else {
    channel = getPreferredChannel(to);
  }
  
  if (channel === 'sms') {
    return sendSms(to, message, { truncate });
  }
  
  return sendWhatsApp(to, message);
}

/**
 * Sends a free-form text message via WhatsApp Cloud API
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<SmsResult> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!accessToken || !phoneNumberId) {
    console.error('❌ [WhatsApp] Credentials not configured');
    return { success: false, error: 'WHATSAPP_CREDENTIALS_MISSING', channel: 'whatsapp' };
  }

  const formattedPhone = formatPhoneForTwilio(to).replace('+', '');
  const validation = validatePhoneForWhatsApp(to);
  if (!validation.valid) {
    console.warn(`⚠️ [WhatsApp] Skipping invalid phone "${to.substring(0, 6)}***" -> reason: "${validation.reason}"`);
    return { success: false, error: `INVALID_PHONE: ${validation.reason}`, channel: 'whatsapp' };
  }

  console.log(`📤 [WhatsApp] Sending to ${formattedPhone.substring(0, 5)}***`);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}`;
      console.error('❌ [WhatsApp] API error:', errorMsg);
      return { success: false, error: errorMsg, channel: 'whatsapp' };
    }

    const messageId = data?.messages?.[0]?.id || 'unknown';
    console.log(`✅ [WhatsApp] Sent successfully: ${messageId}`);
    return { success: true, sid: messageId, status: 'sent', channel: 'whatsapp' };
  } catch (error) {
    console.error('❌ [WhatsApp] Network error:', error);
    return { success: false, error: error.message || 'NETWORK_ERROR', channel: 'whatsapp' };
  }
}

/**
 * Sends a WhatsApp message using a pre-approved template (HSM).
 * Templates bypass the 24-hour conversation window requirement.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  bodyParameters: string[],
  buttonParameters?: string[]
): Promise<SmsResult> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!accessToken || !phoneNumberId) {
    console.error('❌ [WhatsApp Template] Credentials not configured');
    return { success: false, error: 'WHATSAPP_CREDENTIALS_MISSING', channel: 'whatsapp' };
  }

  const formattedPhone = formatPhoneForTwilio(to).replace('+', '');
  const validation = validatePhoneForWhatsApp(to);
  if (!validation.valid) {
    console.warn(`⚠️ [WhatsApp Template] Skipping invalid phone "${to.substring(0, 6)}***" -> reason: "${validation.reason}"`);
    return { success: false, error: `INVALID_PHONE: ${validation.reason}`, channel: 'whatsapp' };
  }

  console.log(`📤 [WhatsApp Template] Sending "${templateName}" to ${formattedPhone.substring(0, 5)}***`);

  try {
    const components: Record<string, unknown>[] = [];
    if (bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters.map(value => ({ type: 'text', text: value })),
      });
    }
    if (buttonParameters && buttonParameters.length > 0) {
      buttonParameters.forEach((value, index) => {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: index.toString(),
          parameters: [{ type: 'text', text: value }],
        });
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}`;
      console.error('❌ [WhatsApp Template] API error:', errorMsg);
      return { success: false, error: errorMsg, channel: 'whatsapp' };
    }

    const messageId = data?.messages?.[0]?.id || 'unknown';
    console.log(`✅ [WhatsApp Template] Sent successfully: ${messageId}`);
    return { success: true, sid: messageId, status: 'sent', channel: 'whatsapp' };
  } catch (error) {
    console.error('❌ [WhatsApp Template] Network error:', error);
    return { success: false, error: error.message || 'NETWORK_ERROR', channel: 'whatsapp' };
  }
}

// Expected total digit lengths (without +) per West African country prefix
const COUNTRY_PHONE_LENGTHS: Record<string, { expected: number; name: string }> = {
  '225': { expected: 13, name: 'Côte d\'Ivoire' },
  '221': { expected: 12, name: 'Sénégal' },
  '229': { expected: 13, name: 'Bénin' },
  '228': { expected: 11, name: 'Togo' },
  '223': { expected: 11, name: 'Mali' },
  '226': { expected: 11, name: 'Burkina Faso' },
  '227': { expected: 11, name: 'Niger' },
};

/**
 * Validates a phone number strictly for WhatsApp delivery.
 * Returns { valid, reason } with a human-readable rejection reason.
 */
export function validatePhoneForWhatsApp(phone: string): { valid: boolean; reason?: string } {
  const formatted = formatPhoneForTwilio(phone);
  const digits = formatted.replace('+', '');

  if (/\D/.test(digits)) {
    return { valid: false, reason: 'Contains non-numeric characters' };
  }

  if (digits.length < 10) {
    return { valid: false, reason: `Too short: ${digits.length} digits (min 10)` };
  }
  if (digits.length > 15) {
    return { valid: false, reason: `Too long: ${digits.length} digits (max 15)` };
  }

  for (const [prefix, { expected, name }] of Object.entries(COUNTRY_PHONE_LENGTHS)) {
    if (digits.startsWith(prefix)) {
      if (digits.length !== expected) {
        return { valid: false, reason: `${name} number must be ${expected} digits, got ${digits.length}` };
      }
      return { valid: true };
    }
  }

  // Generic E.164 fallback
  return { valid: true };
}

/**
 * Checks if a phone number is valid for SMS
 */
export function isValidPhoneForSms(phone: string): boolean {
  const formatted = formatPhoneForTwilio(phone);
  return formatted.length >= 10 && formatted.startsWith('+');
}

/**
 * Checks if SMS is the preferred channel for a phone number
 */
export function shouldUseSms(phone: string): boolean {
  return getPreferredChannel(phone) === 'sms';
}
