import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { Settings } from "lucide-react"

export function SetupTelegramWebhookButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const setupWebhook = async () => {
    try {
      setLoading(true)
      console.log('Setting up Telegram webhook...')
      
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook')
      
      if (error) {
        console.error('Webhook setup error:', error)
        toast({
          title: "Error",
          description: "Failed to setup webhook",
          variant: "destructive",
        })
        return
      }

      console.log('Webhook setup result:', data)
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Telegram webhook setup successfully!",
        })
      } else {
        toast({
          title: "Error", 
          description: data.error || "Failed to setup webhook",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Webhook setup error:', error)
      toast({
        title: "Error",
        description: "Failed to setup webhook",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={setupWebhook}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      <Settings className="h-4 w-4 mr-2" />
      {loading ? 'Setting up...' : 'Setup Webhook'}
    </Button>
  )
}