import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { Trash2 } from "lucide-react"

export function DeleteTelegramWebhookButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const deleteWebhook = async () => {
    try {
      setLoading(true)
      console.log('Deleting Telegram webhook...')
      
      const { data, error } = await supabase.functions.invoke('delete-telegram-webhook')
      
      if (error) {
        console.error('Delete webhook error:', error)
        toast({
          title: "Error",
          description: "Failed to delete webhook",
          variant: "destructive",
        })
        return
      }

      console.log('Delete webhook result:', data)
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Webhook deleted! You can now use getUpdates to get your group ID.",
        })
      } else {
        toast({
          title: "Error", 
          description: data.error || "Failed to delete webhook",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Delete webhook error:', error)
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={deleteWebhook}
      disabled={loading}
      variant="destructive"
      size="sm"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      {loading ? 'Deleting...' : 'Delete Webhook'}
    </Button>
  )
}