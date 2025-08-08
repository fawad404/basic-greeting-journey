import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  QrCode, 
  Copy, 
  Send, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ExternalLink 
} from "lucide-react"

const paymentHistory = [
  {
    date: "2025-08-07 19:33",
    amount: "$300.00 USDT",
    fee: "24.00 USDT",
    hash: "16dfe9f492ea9b8",
    status: "Pending"
  },
  {
    date: "2025-08-06 22:41",
    amount: "$1,181.55 USDT",
    fee: "94.52 USDT",
    hash: "cf104b880b30342",
    status: "Approved"
  },
  {
    date: "2025-08-05 17:43",
    amount: "$6,067.58 USDT",
    fee: "485.41 USDT",
    hash: "1ee47e405ea20a0",
    status: "Approved"
  },
  {
    date: "2025-08-05 00:24",
    amount: "$838.32 USDT",
    fee: "67.07 USDT",
    hash: "29ca603c0df39f4",
    status: "Approved"
  }
]

export default function AddBalance() {
  const [selectedCurrency, setSelectedCurrency] = useState("USDT (TRC20)")
  const [amount, setAmount] = useState("")
  const [txHash, setTxHash] = useState("")
  const [notes, setNotes] = useState("")
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalTransferAmount, setTotalTransferAmount] = useState(0)
  
  const { user } = useAuth()
  const { toast } = useToast()

  const walletAddress = "TWusaMt7fd6t9vABzFfGS84ibZZUax6wz3"

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    })
  }

  const fetchPayments = async () => {
    if (!user) return

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userData) {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })

        setPayments(data || [])

        // Calculate total transfer amount from approved payments
        const approvedPayments = (data || []).filter(payment => payment.status === 'approved')
        const totalApproved = approvedPayments.reduce((sum, payment) => sum + payment.amount, 0)
        setTotalTransferAmount(totalApproved)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPayments()
    }
  }, [user])

  const handleSubmitPayment = async () => {
    if (!amount || !txHash || !user) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
        const { error } = await supabase
          .from('payments')
          .insert({
            user_id: userData.id,
            amount: parseFloat(amount),
            transaction_id: txHash,
            note: notes || null,
          })

        if (error) throw error

        toast({
          title: "Success",
          description: "Successfully sent for approval. Status will update after admin review.",
        })

        // Reset form
        setAmount("")
        setTxHash("")
        setNotes("")
        
        // Refresh payments list
        fetchPayments()
      }
    } catch (error) {
      console.error('Error submitting payment:', error)
      toast({
        title: "Error",
        description: "Failed to submit payment request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add Balance</h1>
        <p className="text-muted-foreground">Deposit cryptocurrency to your account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Crypto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <QrCode className="h-5 w-5" />
              Deposit Crypto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="currency">Select Cryptocurrency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDT (TRC20)">USDT (TRC20)</SelectItem>
                  <SelectItem value="USDT (ERC20)">USDT (ERC20)</SelectItem>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="w-48 h-48 bg-white p-4 rounded-lg border-2 border-muted">
                <img 
                  src="https://res.cloudinary.com/djecn7fxz/image/upload/v1754663116/qr-code_uvgvde.jpg" 
                  alt="Wallet QR Code" 
                  className="w-full h-full object-contain rounded"
                />
              </div>
              <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                <QrCode className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div>
              <Label>Wallet Address:</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={walletAddress}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button size="icon" variant="outline" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-warning mt-2">
                * Please send only TRC20 USDT to this address
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Send className="h-5 w-5" />
              Payment Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount Sent (USDT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="txhash">Transaction Hash (TXID)</Label>
              <Input
                id="txhash"
                placeholder="Enter transaction hash"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleSubmitPayment}
              disabled={loading}
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Submitting..." : "Submit Payment"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Crypto Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Crypto Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">DATE</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">TOTAL TRANSFER AMOUNT</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">TOP-UP AMOUNT</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">FEE</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">TRANSACTION HASH</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(payment.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-2 font-medium">${payments.filter(p => p.status === 'approved' && new Date(p.created_at) <= new Date(payment.created_at)).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</td>
                    <td className="py-4 px-2 font-medium">$0.00</td>
                    <td className="py-4 px-2 text-muted-foreground">{payment.fee ? `$${payment.fee} USDT` : '-'}</td>
                    <td className="py-4 px-2">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary hover:underline"
                        onClick={() => window.open(`https://tronscan.org/#/transaction/${payment.transaction_id}`, '_blank')}
                      >
                        {payment.transaction_id.substring(0, 15)}...
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                    <td className="py-4 px-2">
                      <Badge 
                        variant={payment.status === "approved" ? "default" : "secondary"}
                        className={
                          payment.status === "approved" 
                            ? "bg-success text-success-foreground" 
                            : payment.status === "pending"
                            ? "bg-warning text-warning-foreground"
                            : payment.status === "rejected"
                            ? "bg-destructive text-destructive-foreground"
                            : ""
                        }
                      >
                        {payment.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {payment.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}