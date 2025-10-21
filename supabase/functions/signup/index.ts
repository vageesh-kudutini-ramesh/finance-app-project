import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('🔍 Signup request body:', body)
    const { username, email, password, firstName, lastName, phoneCountryCode, phoneNumber } = body
    console.log('🔍 Extracted phone fields:', { phoneCountryCode, phoneNumber })
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Create user with Supabase Auth and store username in metadata
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          first_name: firstName,
          last_name: lastName,
          phone_country_code: phoneCountryCode,
          phone_number: phoneNumber
        }
      }
    })

    if (error) throw error

    // Create user profile in users table
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .insert([
        {
          id: data.user.id,
          username: username,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone_country_code: phoneCountryCode || null,
          phone_number: phoneNumber || null
        }
      ])
      .select()
      .single()

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ 
        user: profile,
        session: data.session,
        message: data.session ? 'User created and signed in successfully!' : 'User created successfully! Please check your email to confirm your account before signing in.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})