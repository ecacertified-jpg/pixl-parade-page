import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendSms, getPreferredChannel, formatPhoneForTwilio, isValidPhoneForSms } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { phone, message } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'MISSING_PHONE',
          details: 'Phone number is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Twilio configuration
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const senderId = Deno.env.get('TWILIO_SENDER_ID');

    const configStatus = {
      TWILIO_ACCOUNT_SID: !!accountSid,
      TWILIO_AUTH_TOKEN: !!authToken,
      TWILIO_SENDER_ID: !!senderId,
    };

    const missingSecrets = Object.entries(configStatus)
      .filter(([_, configured]) => !configured)
      .map(([name]) => name);

    if (missingSecrets.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TWILIO_CREDENTIALS_MISSING',
          details: `Missing secrets: ${missingSecrets.join(', ')}`,
          configStatus
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format and validate phone
    const formattedPhone = formatPhoneForTwilio(phone);
    const isValid = isValidPhoneForSms(phone);
    const preferredChannel = getPreferredChannel(phone);

    console.log(`📱 Testing SMS to: ${formattedPhone}`);
    console.log(`   Valid: ${isValid}, Preferred channel: ${preferredChannel}`);

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_PHONE',
          details: 'Phone number format is invalid',
          formattedPhone,
          preferredChannel
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send test SMS
    const testMessage = message || `🎉 Test JoieDvivre SMS - ${new Date().toLocaleString('fr-FR')}`;
    
    const result = await sendSms(formattedPhone, testMessage);

    if (result.success) {
      console.log(`✅ SMS test successful: ${result.sid}`);
      return new Response(
        JSON.stringify({
          success: true,
          sid: result.sid,
          status: result.status,
          channel: result.channel,
          formattedPhone,
          preferredChannel,
          configStatus: {
            TWILIO_ACCOUNT_SID: true,
            TWILIO_AUTH_TOKEN: true,
            TWILIO_SENDER_ID: senderId
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error(`❌ SMS test failed: ${result.error}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          errorCode: result.errorCode,
          channel: result.channel,
          formattedPhone,
          preferredChannel
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Error in test-sms:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
