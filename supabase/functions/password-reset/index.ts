import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// OTP storage using existing Supabase database table
const OTP_TABLE = 'email_otps';

// Brevo API configuration (FREE 300 emails/day)
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_FROM_EMAIL = Deno.env.get('BREVO_FROM_EMAIL') || 'financeapp3@gmail.com';

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email using Brevo API with timeout
async function sendEmailViaBrevoAPI(to, otp) {
  try {
    const emailData = {
      sender: {
        name: 'Finwise Team',
        email: BREVO_FROM_EMAIL
      },
      to: [{ email: to, name: 'User' }],
      subject: 'Password Reset OTP - Finwise',
      htmlContent: `
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h2 style="color: #007bff; text-align: center; margin-bottom: 30px;">Password Reset OTP</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              You have requested a password reset for your Finwise account.
            </p>
            <div style="background-color: #ffffff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; color: #666; margin: 0 0 10px 0;">Your OTP (One-Time Password) is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                ${otp}
              </div>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              <strong>Important:</strong> This OTP will expire in 10 minutes.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Please enter this OTP in the app to verify your identity and reset your password.
            </p>
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
              </p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #333; text-align: center; margin-top: 30px;">
              Best regards,<br>
              <strong>Finwise Team</strong>
            </p>
          </div>
        </body>
        </html>
      `
    };

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      return { success: true, method: 'brevo_api', id: result.messageId };
    } else {
      const errorText = await response.text();
      return { success: false, reason: `Brevo API error: ${response.status} - ${errorText}` };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, reason: 'Request timeout - email service unavailable' };
    }
    return { success: false, reason: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
    }
    
    if (!supabaseServiceKey) {
      throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
    }
    
    if (!BREVO_API_KEY) {
      throw new Error('Brevo API key not configured. Please check your Supabase secrets.');
    }
    
    const body = await req.json()
    const { email, action, otp, newPassword } = body
    
    if (!email) throw new Error('Email is required')
    
    // Create client with service role key for admin operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (action === 'send_otp') {
      // Generate and send OTP
      const generatedOTP = generateOTP();
      const expiryTime = Date.now() + (10 * 60 * 1000); // 10 minutes expiry
      
      // Store OTP in database
      const otpData = {
        email: email,
        otp_code: generatedOTP,
        expires_at: new Date(expiryTime).toISOString(),
        purpose: 'password_reset',
        used: false,
        created_at: new Date().toISOString()
      };
      
      // Delete any existing OTP for this email
      await supabaseClient
        .from(OTP_TABLE)
        .delete()
        .eq('email', email);
      
      // Insert new OTP
      const { error: insertError } = await supabaseClient
        .from(OTP_TABLE)
        .insert(otpData);
      
      if (insertError) {
        throw new Error(`Failed to store OTP: ${insertError.message}`);
      }
      
      // Send email via Brevo API
      const emailResult = await sendEmailViaBrevoAPI(email, generatedOTP);
      
      if (emailResult.success) {
        return new Response(
          JSON.stringify({ 
            message: 'Password reset OTP sent successfully to your email. Please check your inbox and enter the OTP code.',
            success: true,
            email: email
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else {
        throw new Error(`Failed to send email: ${emailResult.reason}`);
      }
      
    } else if (action === 'verify_otp') {
      // Verify OTP
      if (!otp) {
        throw new Error('OTP is required for verification')
      }
      
      // Get stored OTP data
      const { data: otpRecord, error: fetchError } = await supabaseClient
        .from(OTP_TABLE)
        .select('*')
        .eq('email', email)
        .single();
      
      if (fetchError || !otpRecord) {
        throw new Error('OTP expired or not found. Please request a new one.')
      }
      
      // Check expiry
      if (new Date() > new Date(otpRecord.expires_at)) {
        await supabaseClient.from(OTP_TABLE).delete().eq('email', email);
        throw new Error('OTP has expired. Please request a new one.')
      }
      
      // Check if already used
      if (otpRecord.used) {
        await supabaseClient.from(OTP_TABLE).delete().eq('email', email);
        throw new Error('OTP has already been used. Please request a new one.')
      }
      
      // Verify OTP
      if (otpRecord.otp_code !== otp) {
        throw new Error('Invalid OTP. Please try again.')
      }
      
      // If newPassword is provided, reset password
      if (newPassword) {
        try {
          // Get user ID from email using admin API
          const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers();
          
          if (userError) {
            throw new Error('Failed to get user data');
          }
          
          const user = userData.users.find(u => u.email === email);
          if (!user) {
            throw new Error('User not found');
          }
          
          // Update password
          const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
          );
          
          if (updateError) {
            throw new Error(`Failed to update password: ${updateError.message}`);
          }
          
          // Mark OTP as used
          await supabaseClient
            .from(OTP_TABLE)
            .update({ used: true })
            .eq('email', email);
          
          return new Response(
            JSON.stringify({ 
              message: 'Password updated successfully! You can now login with your new password.',
              success: true
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
          
        } catch (resetError) {
          throw new Error(`Failed to complete password reset: ${resetError.message}`)
        }
      } else {
        // Just OTP verification
        return new Response(
          JSON.stringify({ 
            message: 'OTP verified successfully! You can now set your new password.',
            success: true 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
      
    } else {
      throw new Error('Invalid action. Use "send_otp" or "verify_otp"')
    }

  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check Supabase secrets and Brevo API configuration'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
