import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('🔍 Transaction request body:', body)
    
    const { amount, category, description, type, transactionDate } = body
    
    // Validate required fields
    if (!amount || !type) {
      throw new Error('Amount and transaction type are required')
    }
    
    // Get user from authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) throw new Error('No authorization header')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify user token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Invalid token')

    // Create transaction
    const { data, error } = await supabaseClient
      .from('transactions')
      .insert([
        {
          amount,
          category: category || 'General',
          description: description || '',
          transaction_type: type,
          transaction_date: transactionDate || new Date().toISOString().split('T')[0],
          user_id: user.id
        }
      ])
      .select()

    if (error) throw error

    // Transform the data to match frontend expectations
    const transformedTransaction = {
      id: data[0].id,
      transactionDate: data[0].transaction_date,
      description: data[0].description,
      category: data[0].category,
      type: data[0].transaction_type,
      amount: data[0].amount,
      user_id: data[0].user_id,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at
    };

    return new Response(
      JSON.stringify({ transaction: transformedTransaction }),
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