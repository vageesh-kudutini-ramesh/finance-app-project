import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Update transaction request received');
    console.log('🔍 Method:', req.method);
    
    const body = await req.json()
    console.log('🔍 Request body:', body);
    
    const { id, amount, category, description, type, transactionDate } = body
    
    // Validate required fields
    if (!id) throw new Error('Transaction ID is required')
    if (!amount) throw new Error('Amount is required')
    if (!type) throw new Error('Transaction type is required')
    
    console.log('🔍 Validated fields:', { id, amount, category, description, type, transactionDate });
    
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

    // Update transaction (only if it belongs to the user)
    console.log('🔍 Attempting to update transaction:', id, 'for user:', user.id);
    
    const updateData = {
      amount: parseFloat(amount),
      category: category || 'General',
      description: description || '',
      transaction_type: type,
      transaction_date: transactionDate || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Update data:', updateData);
    
    const { data, error } = await supabaseClient
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the transaction
      .select()

    if (error) {
      console.log('🔍 Database update error:', error);
      throw error;
    }
    if (data.length === 0) throw new Error('Transaction not found or not owned by user')
    
    console.log('🔍 Transaction updated successfully');

    return new Response(
      JSON.stringify({ transaction: data[0] }),
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