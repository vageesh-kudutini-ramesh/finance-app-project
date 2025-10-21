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
    console.log('🔍 Update investment request received');
    console.log('🔍 Method:', req.method);
    
    const body = await req.json()
    console.log('🔍 Request body:', body);
    
    const { id, symbol, name, shares, purchasePrice, currentPrice } = body
    
    // Validate required fields
    if (!id) throw new Error('Investment ID is required')
    if (!symbol) throw new Error('Symbol is required')
    if (!name) throw new Error('Name is required')
    if (!shares) throw new Error('Shares is required')
    if (!purchasePrice) throw new Error('Purchase price is required')
    if (!currentPrice) throw new Error('Current price is required')
    
    console.log('🔍 Validated fields:', { id, symbol, name, shares, purchasePrice, currentPrice });
    
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

    // Update investment (only if it belongs to the user)
    console.log('🔍 Attempting to update investment:', id, 'for user:', user.id);
    
    const updateData = {
      symbol,
      name,
      shares: parseFloat(shares),
      purchase_price: parseFloat(purchasePrice),
      current_price: parseFloat(currentPrice),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Update data:', updateData);
    
    const { data, error } = await supabaseClient
      .from('investments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the investment
      .select()

    if (error) {
      console.log('🔍 Database update error:', error);
      throw error;
    }
    if (data.length === 0) throw new Error('Investment not found or not owned by user')
    
    console.log('🔍 Investment updated successfully');

    return new Response(
      JSON.stringify({ investment: data[0] }),
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