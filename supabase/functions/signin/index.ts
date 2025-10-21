import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405 
        }
      )
    }

    // Parse request body
    const body = await req.json()
    const { usernameOrEmail, password } = body
    
    // Validate input
    if (!usernameOrEmail || !password) {
      return new Response(
        JSON.stringify({ error: 'Username/Email and password are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    // Check if input is email or username
    const isEmail = usernameOrEmail.includes('@')
    
    let signInEmail = usernameOrEmail
    
    // If it's a username, we need to find the corresponding email
    if (!isEmail) {
      // Use admin client to search auth.users table
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (!supabaseServiceKey) {
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
      
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      try {
        // Get all users and find one with matching username in metadata
        const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
        
        if (usersError || !users) {
          return new Response(
            JSON.stringify({ error: 'Invalid username or password' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
        }
        
        // Find user with matching username in user_metadata
        const user = users.users.find(u => 
          u.user_metadata?.username === usernameOrEmail || 
          u.user_metadata?.user_name === usernameOrEmail
        )
        
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Invalid username or password' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
        }
        
        signInEmail = user.email
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Invalid username or password' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
    }

    // Attempt signin with the email
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: signInEmail,
      password: password
    })

    // Handle auth errors
    if (error) {
      let errorMessage = 'Authentication failed'
      
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.'
      } else {
        errorMessage = error.message
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Success - get username from user metadata
    const username = data.user.user_metadata?.username || 
                   data.user.user_metadata?.user_name || 
                   data.user.email?.split('@')[0] || 
                   'user'
    
    const response = {
      accessToken: data.session?.access_token || 'no-token',
      id: data.user.id,
      username: username,
      email: data.user.email
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    // Handle any unexpected errors
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
