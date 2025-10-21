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
    console.log('🔍 Update budget request received');
    console.log('🔍 Method:', req.method);
    
    const body = await req.json()
    console.log('🔍 Request body:', body);
    
    const { id, category, budgetedAmount, period } = body
    
    // Validate required fields
    if (!id) throw new Error('Budget ID is required')
    if (!category) throw new Error('Category is required')
    if (!budgetedAmount) throw new Error('Budgeted amount is required')
    if (!period) throw new Error('Period is required')
    
    console.log('🔍 Validated fields:', { id, category, budgetedAmount, period });
    
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

    // Update budget (only if it belongs to the user)
    console.log('🔍 Attempting to update budget:', id, 'for user:', user.id);
    
    const updateData = {
      name: category, // Map frontend 'category' to backend 'name'
      amount: parseFloat(budgetedAmount), // Map frontend 'budgetedAmount' to backend 'amount'
      period,
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 Update data:', updateData);
    
    const { data, error } = await supabaseClient
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the budget
      .select()

    if (error) {
      console.log('🔍 Database update error:', error);
      throw error;
    }
    if (data.length === 0) throw new Error('Budget not found or not owned by user')
    
    console.log('🔍 Budget updated successfully');

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