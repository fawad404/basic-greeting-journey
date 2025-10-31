import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { Send, Loader2 } from "lucide-react"

export function TestTelegramButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTestTelegram = async () => {
    setIsLoading(true)
    try {
      console.log('Testing Telegram bot...')
      
      const { data, error } = await supabase.functions.invoke('test-telegram', {
        body: {}
      })

      if (error) {
        console.error('Error calling test-telegram function:', error)
        toast({
          title: "Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      console.log('Test result:', data)

      if (data?.success) {
        toast({
          title: "Test Successful! 🎉",
          description: `Telegram message sent to admin chat ID: ${data.chatId}`,
        })
      } else {
        toast({
          title: "Test Failed",
          description: data?.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: "Test Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleTestTelegram} 
      disabled={isLoading}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      {isLoading ? "Sending Test..." : "Test Telegram Bot"}
    </Button>
  )
}