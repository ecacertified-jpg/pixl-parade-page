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
    // Assume Côte d'Ivoire if no country code
    if (cleaned.length === 10 && (cleaned.startsWith('0') || cleaned.startsWith('05') || cleaned.startsWith('07'))) {
      cleaned = '+225' + cleaned.replace(/^0/, '');
    } else if (cleaned.length === 8) {
      // Côte d'Ivoire without leading 0
      cleaned = '+225' + cleaned;
    } else {
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
  
  // WhatsApp would be handled by the existing whatsapp module
  // For now, return a placeholder indicating WhatsApp should be used
  console.log(`📱 [WhatsApp] Should send via WhatsApp to ${to}`);
  return {
    success: false,
    error: 'WHATSAPP_ROUTING_REQUIRED',
    channel: 'whatsapp'
  };
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
