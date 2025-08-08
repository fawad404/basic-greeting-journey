import { useState } from "react"
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

  const walletAddress = "TCpT92eetbS6Bj5uxTc7cwkxwf4g6DOSUJ"

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
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
                <div className="w-full h-full bg-black/80 flex items-center justify-center rounded">
                  <div className="grid grid-cols-12 gap-1">
                    {Array.from({ length: 144 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 ${
                          Math.random() > 0.5 ? "bg-black" : "bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>
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

            <Button className="w-full" size="lg">
              <Send className="h-4 w-4 mr-2" />
              Submit Payment
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
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">AMOUNT</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">FEE</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">TRANSACTION HASH</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {payment.date}
                      </div>
                    </td>
                    <td className="py-4 px-2 font-medium">{payment.amount}</td>
                    <td className="py-4 px-2 text-muted-foreground">{payment.fee}</td>
                    <td className="py-4 px-2">
                      <Button variant="link" className="p-0 h-auto text-primary hover:underline">
                        {payment.hash}...
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                    <td className="py-4 px-2">
                      <Badge 
                        variant={payment.status === "Approved" ? "default" : "secondary"}
                        className={
                          payment.status === "Approved" 
                            ? "bg-success text-success-foreground" 
                            : payment.status === "Pending"
                            ? "bg-warning text-warning-foreground"
                            : ""
                        }
                      >
                        {payment.status === "Approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {payment.status === "Pending" && <Clock className="h-3 w-3 mr-1" />}
                        {payment.status}
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