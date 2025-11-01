const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function createTestInlineKeyboard(transactionId: string) {
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

async function sendTelegramMessage(message: string, transactionId: string): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')
  
  console.log('=== Testing Telegram Bot ===')
  console.log('Bot Token exists:', !!TELEGRAM_BOT_TOKEN)
  console.log('Admin Chat ID:', ADMIN_CHAT_ID)
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not found in environment variables')
    return false
  }

  if (!ADMIN_CHAT_ID) {
    console.error('TELEGRAM_ADMIN_CHAT_ID not found in environment variables')
    return false
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  console.log('Telegram API URL:', url)
  
  try {
    const payload = {
      chat_id: ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      reply_markup: createTestInlineKeyboard(transactionId)
    }
    console.log('Sending payload:', payload)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response body:', responseText)

    if (!response.ok) {
      console.error('Telegram API error:', response.status, responseText)
      return false
    }

    console.log('✅ Telegram notification sent successfully')
    return true
  } catch (error) {
    console.error('❌ Error sending Telegram notification:', error)
    return false
  }
}

Deno.serve(async (req) => {
  console.log('=== Test Telegram Function Called ===')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')
    
    const testTransactionId = `TOPUP-${Date.now()}-TEST123`
    const testMessage = `🧪 <b>Test Message</b>

This is a test notification from your payment system bot.

🔔 <b>New Top-Up Request</b>

👤 <b>User:</b> test@example.com
💰 <b>Amount:</b> $100.00
📝 <b>Note:</b> This is a test top-up request

⏰ <b>Time:</b> ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })}

✅ <b>Status:</b> Bot is working correctly!`

    console.log('Sending test message...')
    const success = await sendTelegramMessage(testMessage, testTransactionId)

    if (success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Test notification sent successfully to Telegram!',
          chatId: ADMIN_CHAT_ID
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send test notification',
          details: 'Check the function logs for more details'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error: any) {
    console.error('❌ Error in test-telegram function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})