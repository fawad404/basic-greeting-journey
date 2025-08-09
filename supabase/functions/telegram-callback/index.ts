import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Telegram callback received:', body)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not found')
      return new Response('Bot token not found', { status: 500 })
    }

    // Handle callback query
    if (body.callback_query) {
      const callbackData = body.callback_query.data
      const chatId = body.callback_query.message.chat.id
      const messageId = body.callback_query.message.message_id
      
      console.log('Callback data:', callbackData)
      
      if (callbackData.startsWith('view_')) {
        const transactionId = callbackData.substring(5) // Remove 'view_' prefix
        
        console.log(`Handling view request for transaction:`, transactionId)
        
        // Send response to user and redirect to specific top-up request
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: "Opening top-up request...",
            show_alert: false,
            url: `https://hywkmccpblatkfsbnapn.supabase.co/top-up-requests?transaction=${transactionId}`
          })
        })
        
        console.log(`✅ Redirected to view transaction ${transactionId}`)
      }
    }

    return new Response('OK', { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    console.error('Error in telegram-callback function:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    })
  }
})