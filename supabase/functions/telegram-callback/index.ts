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
      
      if (callbackData.startsWith('approve_') || callbackData.startsWith('reject_')) {
        const action = callbackData.split('_')[0]
        const transactionId = callbackData.substring(action.length + 1)
        
        console.log(`Processing ${action} for transaction:`, transactionId)
        
        // Update payment status in database
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        const { error } = await supabase
          .from('payments')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', transactionId)

        if (error) {
          console.error('Database error:', error)
          // Send error response to Telegram
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: `❌ Error ${action === 'approve' ? 'approving' : 'rejecting'} top-up request`,
              show_alert: true
            })
          })
          return new Response('Database error', { status: 500 })
        }

        // Edit the message to show the action taken
        const emoji = action === 'approve' ? '✅' : '❌'
        const actionText = action === 'approve' ? 'APPROVED' : 'REJECTED'
        const updatedText = body.callback_query.message.text + `\n\n${emoji} <b>Status: ${actionText}</b>`
        
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: updatedText,
            parse_mode: 'HTML'
          })
        })

        // Send confirmation response
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: `${emoji} Top-up request ${actionText.toLowerCase()} successfully!`,
            show_alert: true
          })
        })

        console.log(`✅ Successfully ${action}ed transaction ${transactionId}`)
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