import { supabase } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  userEmail: string
  amount: number
  transactionId: string
  note?: string
}

async function sendTelegramMessage(message: string, transactionId: string): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const ADMIN_CHAT_ID = '7610098144'
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not found in environment variables')
    return false
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: createInlineKeyboard(transactionId)
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Telegram API error:', response.status, errorText)
      return false
    }

    console.log('Telegram notification sent successfully')
    return true
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}

function createInlineKeyboard(transactionId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "✅ Approve Top-up",
          callback_data: `approve_${transactionId}`
        },
        {
          text: "❌ Reject Top-up", 
          callback_data: `reject_${transactionId}`
        }
      ],
      [
        {
          text: "👁️ View Top-up",
          url: "https://hywkmccpblatkfsbnapn.supabase.co/top-up-requests"
        }
      ]
    ]
  }
}

function formatTopUpNotification(data: NotificationRequest): string {
  return `🔔 <b>New Top-Up Request</b>

👤 <b>User:</b> ${data.userEmail}
💰 <b>Amount:</b> $${data.amount}
${data.note ? `📝 <b>Note:</b> ${data.note}` : ''}

⏰ <b>Time:</b> ${new Date().toLocaleString()}`
}

Deno.serve(async (req) => {
  console.log('=== Telegram notification function called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Attempting to parse request body...')
    const body = await req.json()
    console.log('Parsed body:', body)
    
    const { userEmail, amount, transactionId, note }: NotificationRequest = body
    
    console.log('Received notification request:', { userEmail, amount, transactionId, note })

    if (!userEmail || !amount || !transactionId) {
      console.error('Missing required fields:', { userEmail, amount, transactionId })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Formatting message...')
    const message = formatTopUpNotification({ userEmail, amount, transactionId, note })
    console.log('Formatted message:', message)
    
    console.log('Sending Telegram message...')
    const success = await sendTelegramMessage(message, transactionId)
    console.log('Telegram send result:', success)

    if (success) {
      console.log('✅ Notification sent successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Notification sent successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.error('❌ Failed to send notification')
      return new Response(
        JSON.stringify({ error: 'Failed to send notification' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('❌ Error in send-telegram-notification function:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})