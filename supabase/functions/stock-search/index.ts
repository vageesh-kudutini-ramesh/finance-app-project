import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const keywords = url.searchParams.get('keywords');
    
    if (!keywords) {
      throw new Error('Keywords parameter is required');
    }

    // Alpha Vantage API call with your API key
    const alphaVantageUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=NQR0XL88BDN6N3PB`;
    
    console.log('🔍 Searching Alpha Vantage for:', keywords);
    
    const response = await fetch(alphaVantageUrl);
    const data = await response.json();
    
    console.log('🔍 Alpha Vantage response status:', response.status);
    console.log('🔍 Alpha Vantage data keys:', Object.keys(data));
    
    if (data.bestMatches && data.bestMatches.length > 0) {
      const results = data.bestMatches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        marketOpen: match['5. marketOpen'],
        marketClose: match['6. marketClose'],
        timezone: match['7. timezone'],
        currency: match['8. currency'],
        matchScore: match['9. matchScore']
      }));
      
      console.log('🔍 Found', results.length, 'stocks for', keywords);
      console.log('🔍 First few results:', results.slice(0, 3));
      
      return new Response(
        JSON.stringify(results),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else if (data['Error Message']) {
      console.log('🔍 Alpha Vantage API Error:', data['Error Message']);
      throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
    } else if (data['Note']) {
      console.log('🔍 Alpha Vantage Rate Limit:', data['Note']);
      throw new Error(`Alpha Vantage Rate Limit: ${data['Note']}`);
    } else {
      console.log('🔍 No results found for:', keywords);
      return new Response(
        JSON.stringify([]),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

  } catch (error) {
    console.error('🔍 Stock search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
