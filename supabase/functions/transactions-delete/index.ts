import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Delete transaction request received');
    console.log('🔍 Method:', req.method);
    
    // For DELETE requests, get ID from query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    console.log('🔍 Transaction ID to delete:', id);
    
    if (!id) {
      throw new Error('Transaction ID is required');
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

    // Delete transaction (only if it belongs to the user)
    console.log('🔍 Attempting to delete transaction:', id, 'for user:', user.id);
    
    const { error } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the transaction

    if (error) {
      console.log('🔍 Database delete error:', error);
      throw error;
    }
    
    console.log('🔍 Transaction deleted successfully');

    return new Response(
      JSON.stringify({ message: 'Transaction deleted successfully' }),
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