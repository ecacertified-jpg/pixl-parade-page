 /**
  * Shared WhatsApp Sender Module via Meta Cloud API
  * Primary notification channel - SMS is fallback
  */
 
 export interface WhatsAppResult {
   success: boolean;
   messageId?: string;
   error?: string;
   channel: 'whatsapp';
 }
 
 /**
  * Formats a phone number for WhatsApp API (removes + prefix)
  */
 export function formatPhoneForWhatsApp(phone: string): string {
   if (!phone) return '';
   
   // Remove all non-digit characters
   let cleaned = phone.replace(/[^\d]/g, '');
   
   // Handle Côte d'Ivoire numbers (10 digits starting with 0)
   if (cleaned.length === 10 && /^0[157]/.test(cleaned)) {
     cleaned = '225' + cleaned;
   }
   // Handle old CI format (8 digits)
   else if (cleaned.length === 8 && /^[0-9]/.test(cleaned)) {
     cleaned = '225' + cleaned;
   }
   // Handle Sénégal (9 digits starting with 7)
   else if (cleaned.length === 9 && /^7/.test(cleaned)) {
     cleaned = '221' + cleaned;
   }
   
   return cleaned;
 }
 
 /**
  * Sends a WhatsApp text message via Meta Cloud API
  * @param to - Recipient phone number
  * @param message - Message content
  * @param options - Optional configuration
  * @returns WhatsAppResult with success status and details
  */
 export async function sendWhatsAppMessage(
   to: string,
   message: string,
   options: {
     retryOnce?: boolean;
   } = {}
 ): Promise<WhatsAppResult> {
   const { retryOnce = true } = options;
   
   const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
   const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
   
   if (!phoneNumberId || !accessToken) {
     console.error('❌ [WhatsApp] Credentials not configured');
     return {
       success: false,
       error: 'WHATSAPP_CREDENTIALS_MISSING',
       channel: 'whatsapp'
     };
   }
   
   const formattedPhone = formatPhoneForWhatsApp(to);
   if (!formattedPhone || formattedPhone.length < 10) {
     console.error('❌ [WhatsApp] Invalid phone number:', to);
     return {
       success: false,
       error: 'INVALID_PHONE_NUMBER',
       channel: 'whatsapp'
     };
   }
   
   const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
   
   console.log(`📱 [WhatsApp] Sending to ${formattedPhone.substring(0, 6)}***`);
   
   try {
     const response = await fetch(apiUrl, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${accessToken}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         messaging_product: 'whatsapp',
         to: formattedPhone,
         type: 'text',
         text: { body: message },
       }),
     });
     
     const data = await response.json();
     
     if (!response.ok) {
       const errorMsg = data.error?.message || `HTTP ${response.status}`;
       console.error('❌ [WhatsApp] API error:', errorMsg);
       
       // Retry once on server errors
       if (retryOnce && response.status >= 500) {
         console.log('🔄 [WhatsApp] Retrying after server error...');
         await new Promise(resolve => setTimeout(resolve, 1000));
         return sendWhatsAppMessage(to, message, { retryOnce: false });
       }
       
       return {
         success: false,
         error: errorMsg,
         channel: 'whatsapp'
       };
     }
     
     const messageId = data.messages?.[0]?.id;
     console.log(`✅ [WhatsApp] Sent successfully: ${messageId}`);
     
     return {
       success: true,
       messageId,
       channel: 'whatsapp'
     };
     
   } catch (error) {
     console.error('❌ [WhatsApp] Network error:', error);
     
     if (retryOnce) {
       console.log('🔄 [WhatsApp] Retrying after network error...');
       await new Promise(resolve => setTimeout(resolve, 1000));
       return sendWhatsAppMessage(to, message, { retryOnce: false });
     }
     
     return {
       success: false,
       error: error.message || 'NETWORK_ERROR',
       channel: 'whatsapp'
     };
   }
 }
 
 /**
  * Checks if a phone number is valid for WhatsApp
  */
 export function isValidPhoneForWhatsApp(phone: string): boolean {
   const formatted = formatPhoneForWhatsApp(phone);
   return formatted.length >= 10;
 }