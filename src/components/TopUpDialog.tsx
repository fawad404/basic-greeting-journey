import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useBalance } from "@/contexts/BalanceContext"
import { DollarSign, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TopUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId?: string
  accountName?: string
}

export function TopUpDialog({ open, onOpenChange, accountId, accountName }: TopUpDialogProps) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { user } = useAuth()
  const { toast } = useToast()
  const { balance, isLoading: balanceLoading, updateBalanceAfterTopUp, refreshBalance } = useBalance()

  useEffect(() => {
    if (open && user) {
      refreshBalance()
    }
  }, [open, user, refreshBalance])


  const userBalance = balance || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !user) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive",
      })
      return
    }

    const topUpAmount = parseFloat(amount)
    
    if (topUpAmount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      })
      return
    }

    if (topUpAmount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have $${userBalance.toFixed(2)} available. Please add more balance first.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userData) {
        // Store the current balance before deduction (this will be the "Total Transfer Amount")
        const currentBalance = userBalance
        const transactionId = `TOPUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Create a top-up request entry in payments table with a special type
        const { error } = await supabase
          .from('payments')
          .insert({
            user_id: userData.id,
            amount: topUpAmount,
            transaction_id: transactionId,
            note: note || `Top-up request for ${accountName || 'account'}${accountId ? ` (ID: ${accountId})` : ''}`,
            status: 'pending',
            user_balance_at_time: currentBalance
          })

        if (error) throw error

        // Send Telegram notification to admin
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: {
              userEmail: user.email,
              amount: topUpAmount,
              transactionId: transactionId,
              requestType: 'top-up',
              accountName: accountName,
              note: note || `Top-up request for ${accountName || 'account'}${accountId ? ` (ID: ${accountId})` : ''}`
            }
          });
        } catch (telegramError) {
          console.error('Error sending Telegram notification:', telegramError);
          // Don't fail the whole operation if Telegram fails
        }

        toast({
          title: "Top-up Request Submitted",
          description: `Your request for $${topUpAmount} has been sent to admin for approval.`,
        })

        // Update balance immediately in context
        updateBalanceAfterTopUp(topUpAmount)

        // Reset form
        setAmount("")
        setNote("")
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error submitting top-up request:', error)
      toast({
        title: "Error",
        description: "Failed to submit top-up request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAmount("")
    setNote("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Request Top-up
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {accountName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Account: {accountName}</p>
              {accountId && <p className="text-xs text-muted-foreground">ID: {accountId}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Available Balance</Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-semibold">
                ${balanceLoading ? "Loading..." : (balance?.toFixed(2) || '0.00')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Top-up Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {amount && parseFloat(amount) > userBalance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient balance. You need ${(parseFloat(amount) - userBalance).toFixed(2)} more.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add any additional notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !amount || parseFloat(amount) > userBalance || parseFloat(amount) <= 0}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}