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

async function sendTelegramMessage(message: string): Promise<boolean> {
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

function formatTopUpNotification(data: NotificationRequest): string {
  return `🔔 <b>New Top-Up Request</b>

👤 <b>User:</b> ${data.userEmail}
💰 <b>Amount:</b> $${data.amount}
🔗 <b>Transaction ID:</b> ${data.transactionId}
${data.note ? `📝 <b>Note:</b> ${data.note}` : ''}

⏰ <b>Time:</b> ${new Date().toLocaleString()}

Please review and approve/reject this request in the admin panel.`
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userEmail, amount, transactionId, note }: NotificationRequest = await req.json()
    
    console.log('Received notification request:', { userEmail, amount, transactionId, note })

    if (!userEmail || !amount || !transactionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const message = formatTopUpNotification({ userEmail, amount, transactionId, note })
    const success = await sendTelegramMessage(message)

    if (success) {
      return new Response(
        JSON.stringify({ success: true, message: 'Notification sent successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to send notification' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('Error in send-telegram-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})