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
    console.log('🔍 Create budget request received');
    console.log('🔍 Method:', req.method);
    
    const body = await req.json()
    console.log('🔍 Request body:', body);
    
    const { category, budgetedAmount, period } = body
    
    // Validate required fields
    if (!category) throw new Error('Category is required')
    if (!budgetedAmount) throw new Error('Budgeted amount is required')
    if (!period) throw new Error('Period is required')
    
    console.log('🔍 Validated fields:', { category, budgetedAmount, period });
    
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

    // Create budget
    console.log('🔍 Attempting to create budget for user:', user.id);
    
    const budgetData = {
      name: category,
      amount: parseFloat(budgetedAmount),
      period,
      user_id: user.id
    };
    
    console.log('🔍 Budget data to insert:', budgetData);
    
    const { data, error } = await supabaseClient
      .from('budgets')
      .insert([budgetData])
      .select()

    if (error) {
      console.log('🔍 Database insert error:', error);
      throw error;
    }
    
    console.log('🔍 Budget created successfully');

    return new Response(
      JSON.stringify({ budget: data[0] }),
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