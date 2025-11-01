import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateMessageRequest {
  transactionId: string
  status: 'approved' | 'rejected'
  userEmail: string
  amount: number
}

async function updateTelegramMessage(transactionId: string, status: 'approved' | 'rejected', userEmail: string, amount: number): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const ADMIN_CHAT_ID = '7610098144'
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not found in environment variables')
    return false
  }

  // First, get all messages from the chat to find the one with our transaction
  const getUpdatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`
  
  try {
    const updatesResponse = await fetch(getUpdatesUrl)
    const updatesData = await updatesResponse.json()
    
    if (!updatesData.ok) {
      console.error('Failed to get updates:', updatesData)
      return false
    }

    // Find the message that contains our transaction ID
    let targetMessageId = null
    for (const update of updatesData.result.reverse()) { // Start from most recent
      if (update.message && 
          update.message.chat.id.toString() === ADMIN_CHAT_ID &&
          update.message.text && 
          update.message.text.includes(transactionId)) {
        targetMessageId = update.message.message_id
        break
      }
    }

    if (!targetMessageId) {
      console.log('Could not find original message for transaction:', transactionId)
      return false
    }

    // Create the updated message
    const emoji = status === 'approved' ? '✅' : '❌'
    const actionText = status === 'approved' ? 'APPROVED' : 'REJECTED'
    
    const updatedText = `🔔 <b>New Top-Up Request</b>

👤 <b>User:</b> ${userEmail}
💰 <b>Amount:</b> $${amount}

⏰ <b>Time:</b> ${new Date().toLocaleString()}

${emoji} <b>Status: ${actionText}</b>`

    // Update the message
    const editUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`
    const editResponse = await fetch(editUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        message_id: targetMessageId,
        text: updatedText,
        parse_mode: 'HTML'
      })
    })

    const editResult = await editResponse.json()
    
    if (!editResult.ok) {
      console.error('Failed to edit message:', editResult)
      return false
    }

    console.log(`✅ Successfully updated Telegram message for transaction ${transactionId} to ${status}`)
    return true
    
  } catch (error) {
    console.error('Error updating Telegram message:', error)
    return false
  }
}

Deno.serve(async (req) => {
  console.log('=== Update Telegram message function called ===')
  console.log('Request method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Attempting to parse request body...')
    const body = await req.json()
    console.log('Parsed body:', body)
    
    const { transactionId, status, userEmail, amount }: UpdateMessageRequest = body
    
    console.log('Received update request:', { transactionId, status, userEmail, amount })

    if (!transactionId || !status || !userEmail || !amount) {
      console.error('Missing required fields:', { transactionId, status, userEmail, amount })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Updating Telegram message...')
    const success = await updateTelegramMessage(transactionId, status, userEmail, amount)
    console.log('Update result:', success)

    if (success) {
      console.log('✅ Message updated successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Telegram message updated successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.error('❌ Failed to update message')
      return new Response(
        JSON.stringify({ error: 'Failed to update Telegram message' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('❌ Error in update-telegram-message function:', error)
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