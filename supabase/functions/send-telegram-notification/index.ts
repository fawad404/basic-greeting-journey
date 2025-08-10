import { supabase } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  userEmail: string
  amount?: number
  transactionId: string
  note?: string
  requestType: 'top-up' | 'replacement' | 'change-access' | 'payment'
  description?: string
  accountName?: string
  reason?: string
  screenshotUrl?: string
  userBalance?: number
  totalTopUpAmount?: number
}

async function sendTelegramMessage(message: string, transactionId: string, requestType: string, screenshotUrl?: string): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')
  
  if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not found in environment variables')
    return false
  }

  try {
    // If there's a screenshot for replacement requests, send photo with caption
    if (screenshotUrl && requestType === 'replacement') {
      const photoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
      
      const response = await fetch(photoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          photo: screenshotUrl,
          caption: message,
          parse_mode: 'HTML',
          reply_markup: createInlineKeyboard(transactionId, requestType)
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Telegram Photo API error:', response.status, errorText)
        return false
      }
    } else {
      // Send regular text message
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          reply_markup: createInlineKeyboard(transactionId, requestType)
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Telegram API error:', response.status, errorText)
        return false
      }
    }

    console.log('Telegram notification sent successfully')
    return true
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}

function createInlineKeyboard(transactionId: string, requestType: string) {
  const APP_DOMAIN = Deno.env.get('APP_DOMAIN') || 'https://goads-dashboard.vercel.app'
  
  let viewUrl = ''
  
  switch (requestType) {
    case 'top-up':
    case 'payment':
      viewUrl = `${APP_DOMAIN}/top-up-requests?transaction=${transactionId}`
      break
    case 'replacement':
      viewUrl = `${APP_DOMAIN}/replacement-requests`
      break
    case 'change-access':
      viewUrl = `${APP_DOMAIN}/change-access-requests`
      break
    default:
      viewUrl = `${APP_DOMAIN}/requests`
  }
  
  return {
    inline_keyboard: [
      [
        {
          text: "👁️ View Request",
          url: viewUrl
        }
      ]
    ]
  }
}

function formatNotification(data: NotificationRequest): string {
  const icons = {
    'top-up': '💰',
    'payment': '💳',
    'replacement': '🔄',
    'change-access': '🔑'
  }
  
  const titles = {
    'top-up': 'New Top-Up Request',
    'payment': 'New Payment Request',
    'replacement': 'New Account Replacement Request',
    'change-access': 'New Change Access Request'
  }
  
  const icon = icons[data.requestType] || '📋'
  const title = titles[data.requestType] || 'New Request'
  
  let message = `${icon} <b>${title}</b>

👤 <b>User:</b> ${data.userEmail}`

  if (data.amount && (data.requestType === 'top-up' || data.requestType === 'payment')) {
    message += `\n💰 <b>Amount:</b> $${data.amount}`
  }
  
  // Add TXID for payment requests with clickable link
  if (data.requestType === 'payment' && data.transactionId) {
    const tronScanUrl = `https://tronscan.org/#/transaction/${data.transactionId}`
    message += `\n🔗 <b>TXID:</b> <a href="${tronScanUrl}">${data.transactionId}</a>`
  }
  
  if (data.accountName) {
    message += `\n🏷️ <b>Account:</b> ${data.accountName}`
  }
  
  if (data.reason) {
    message += `\n❗ <b>Reason:</b> ${data.reason}`
  }
  
  if (data.description) {
    message += `\n📝 <b>Description:</b> ${data.description}`
  }
  
  if (data.note) {
    message += `\n📝 <b>Note:</b> ${data.note}`
  }
  
  message += `\n\n⏰ <b>Time:</b> ${new Date().toLocaleString()}`
  
  return message
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
    
    const data: NotificationRequest = body
    
    console.log('Received notification request:', data)

    if (!data.userEmail || !data.transactionId || !data.requestType) {
      console.error('Missing required fields:', data)
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userEmail, transactionId, and requestType are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Formatting message...')
    const message = formatNotification(data)
    console.log('Formatted message:', message)
    
    console.log('Sending Telegram message...')
    const success = await sendTelegramMessage(message, data.transactionId, data.requestType, data.screenshotUrl)
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