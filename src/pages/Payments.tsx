import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { CheckCircle, XCircle, Clock, Receipt, ExternalLink, Edit } from "lucide-react"

interface Payment {
  id: string
  user_id: string
  amount: number
  fee: number | null
  transaction_id: string
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user_email?: string
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [fee, setFee] = useState("")
  const [topUpAmount, setTopUpAmount] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editAmount, setEditAmount] = useState("")
  const [editTxHash, setEditTxHash] = useState("")
  const [editNote, setEditNote] = useState("")
  const { toast } = useToast()

  const fetchPayments = async () => {
    try {
      // First get all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

      // Then get user emails for each payment
      const paymentsWithEmails = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', payment.user_id)
            .single()

          return {
            ...payment,
            user_email: userData?.email || 'Unknown'
          }
        })
      )

      setPayments(paymentsWithEmails as Payment[])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const handleEditClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setEditAmount(payment.amount.toString())
    setEditTxHash(payment.transaction_id)
    setEditNote(payment.note || "")
    setFee(payment.fee?.toString() || "")
    setEditDialogOpen(true)
  }

  const handleConfirmEdit = async () => {
    if (!selectedPayment) return

    try {
      const feeAmount = fee ? parseFloat(fee) : null
      const amountValue = parseFloat(editAmount)

      // Update payment details
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          amount: amountValue,
          transaction_id: editTxHash,
          note: editNote || null,
          fee: feeAmount
        })
        .eq('id', selectedPayment.id)

      if (paymentError) throw paymentError

      toast({
        title: "Payment Updated",
        description: "Payment details have been updated successfully.",
      })

      setEditDialogOpen(false)
      setSelectedPayment(null)
      fetchPayments()
    } catch (error) {
      console.error('Error updating payment:', error)
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      })
    }
  }

  const handleApproveClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setFee("")
    setTopUpAmount("")
    setDialogOpen(true)
  }

  const handleConfirmApprove = async () => {
    if (!selectedPayment) return

    try {
      const feeAmount = fee ? parseFloat(fee) : 0
      const topUpAmountValue = topUpAmount ? parseFloat(topUpAmount) : 0

      // Update payment status, fee, and amount to reflect the actual top-up amount
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          fee: feeAmount,
          amount: topUpAmountValue // Update amount to be the top-up amount (what user gets)
        })
        .eq('id', selectedPayment.id)

      if (paymentError) throw paymentError

      // Note: Balance calculation is handled dynamically in BalanceContext
      // No need to update user_balances table here

      const totalTransferAmount = topUpAmountValue + feeAmount

      toast({
        title: "Payment Approved",
        description: `Top-up of $${topUpAmountValue.toFixed(2)} approved (Total Transfer: $${totalTransferAmount.toFixed(2)}, Fee: $${feeAmount.toFixed(2)})`,
      })

      setDialogOpen(false)
      setSelectedPayment(null)
      setFee("")
      setTopUpAmount("")
      fetchPayments()
    } catch (error) {
      console.error('Error approving payment:', error)
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId)

      if (error) throw error

      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected.",
      })

      fetchPayments()
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading payments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments Management</h1>
        <p className="text-muted-foreground">Approve or reject user payment requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Transaction Hash</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.user_email}</TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{payment.fee ? `$${payment.fee.toFixed(2)}` : '-'}</TableCell>
                  <TableCell className="font-mono text-sm">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary hover:underline font-mono text-sm"
                      onClick={() => window.open(`https://tronscan.org/#/transaction/${payment.transaction_id}`, '_blank')}
                    >
                      {payment.transaction_id.length > 20 
                        ? `${payment.transaction_id.substring(0, 20)}...` 
                        : payment.transaction_id}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </TableCell>
                  <TableCell>{payment.note || '-'}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveClick(payment)}
                              className="bg-success text-success-foreground hover:bg-success/90"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Payment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Original Deposit Amount (Read-only)</Label>
                                <Input 
                                  value={`$${selectedPayment?.amount.toFixed(2) || ''}`} 
                                  disabled 
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Amount user originally deposited
                                </p>
                              </div>
                              <div>
                                <Label>Transaction ID</Label>
                                <Input 
                                  value={selectedPayment?.transaction_id || ''} 
                                  disabled 
                                />
                              </div>
                              <div>
                                <Label>Note</Label>
                                <Input 
                                  value={selectedPayment?.note || ''} 
                                  disabled 
                                />
                              </div>
                              
                              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-medium">Admin Payment Breakdown</h4>
                                
                                <div>
                                  <Label htmlFor="topUpAmount">Total Top-up Amount</Label>
                                  <Input
                                    id="topUpAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Amount to credit to user's balance
                                  </p>
                                </div>
                                
                                <div>
                                  <Label htmlFor="fee">Fee Amount</Label>
                                  <Input
                                    id="fee"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={fee}
                                    onChange={(e) => setFee(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Admin fee deducted from deposit
                                  </p>
                                </div>

                                {topUpAmount && fee && (
                                  <div className="mt-3 p-3 bg-background rounded border">
                                    <div className="text-sm space-y-1">
                                      <div className="flex justify-between">
                                        <span>Total Transfer Amount:</span>
                                        <span className="font-medium">${(parseFloat(topUpAmount) + parseFloat(fee)).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>User Gets (Top-up):</span>
                                        <span className="font-medium text-success">${parseFloat(topUpAmount).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Admin Fee:</span>
                                        <span className="font-medium">${parseFloat(fee).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleConfirmApprove}
                                  className="bg-success text-success-foreground hover:bg-success/90"
                                  disabled={!topUpAmount || !fee}
                                >
                                  Confirm Approve
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(payment.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(payment)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Payment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="editAmount">Amount</Label>
                              <Input
                                id="editAmount"
                                type="number"
                                placeholder="0.00"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="editTxHash">Transaction Hash</Label>
                              <Input
                                id="editTxHash"
                                placeholder="Transaction hash"
                                value={editTxHash}
                                onChange={(e) => setEditTxHash(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="editNote">Note</Label>
                              <Input
                                id="editNote"
                                placeholder="Note"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="editFee">Fee</Label>
                              <Input
                                id="editFee"
                                type="number"
                                placeholder="0.00"
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                onClick={() => setEditDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleConfirmEdit}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {payment.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(payment.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {payments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No payment requests found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}