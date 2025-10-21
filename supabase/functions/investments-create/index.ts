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
    console.log('🔍 Create investment request received');
    console.log('🔍 Method:', req.method);
    
    const body = await req.json()
    console.log('🔍 Request body:', body);
    
    const { symbol, name, shares, purchasePrice, currentPrice } = body
    
    // Validate required fields
    if (!symbol) throw new Error('Symbol is required')
    if (!name) throw new Error('Name is required')
    if (!shares) throw new Error('Shares is required')
    if (!purchasePrice) throw new Error('Purchase price is required')
    if (!currentPrice) throw new Error('Current price is required')
    
    console.log('🔍 Validated fields:', { symbol, name, shares, purchasePrice, currentPrice });
    
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

    // Create investment
    console.log('🔍 Attempting to create investment for user:', user.id);
    
    // Try different possible column names based on common database schemas
    const investmentData = {
      symbol,
      name,
      shares: parseFloat(shares),
      purchase_price: parseFloat(purchasePrice),
      current_price: parseFloat(currentPrice),
      user_id: user.id
    };
    
    console.log('🔍 Investment data to insert:', investmentData);
    
    const { data, error } = await supabaseClient
      .from('investments')
      .insert([investmentData])
      .select()

    if (error) {
      console.log('🔍 Database insert error:', error);
      throw error;
    }
    
    console.log('🔍 Investment created successfully');

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