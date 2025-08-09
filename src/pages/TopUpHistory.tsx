import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { CheckCircle, XCircle, Clock, History, DollarSign } from "lucide-react"

interface TopUpRequest {
  id: string
  amount: number
  transaction_id: string
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  fee?: number
  user_balance_at_time?: number
}

export default function TopUpHistory() {
  const [requests, setRequests] = useState<TopUpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userBalance, setUserBalance] = useState(0)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchTopUpHistory = async () => {
    if (!user) return

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userData) {
        // Fetch all top-up requests (identified by transaction_id starting with 'TOPUP-')
        const { data: requestsData, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userData.id)
          .like('transaction_id', 'TOPUP-%')
          .order('created_at', { ascending: false })

        if (error) throw error

        setRequests((requestsData || []) as TopUpRequest[])

        // Calculate current balance using the same logic as BalanceContext
        const { data: allPayments } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userData.id)

        let calculatedBalance = 0
        if (allPayments) {
          // Add crypto deposits (admin-entered top-up amounts)
          const cryptoDeposits = allPayments.filter(p => 
            !p.transaction_id.startsWith('TOPUP-') && p.status === 'approved'
          )
          const cryptoBalance = cryptoDeposits.reduce((sum, payment) => {
            // For crypto deposits, amount is the admin-entered "Total Top-up Amount"
            return sum + payment.amount
          }, 0)
          
          // Subtract pending top-ups (amounts deducted from balance when request was made)
          const pendingTopUps = allPayments.filter(p => 
            p.transaction_id.startsWith('TOPUP-') && p.status === 'pending'
          )
          const pendingAmount = pendingTopUps.reduce((sum, payment) => sum + payment.amount, 0)
          
          // Note: Approved top-ups don't add to balance - they just remove the pending deduction
          // The user's balance was already reduced when they made the top-up request
          
          calculatedBalance = cryptoBalance - pendingAmount
        }

        setUserBalance(calculatedBalance)
      }
    } catch (error) {
      console.error('Error fetching top-up history:', error)
      toast({
        title: "Error",
        description: "Failed to fetch top-up history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopUpHistory()
  }, [user])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return "bg-success text-success-foreground"
      case 'rejected':
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-warning text-warning-foreground"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading top-up history...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Top-up History</h1>
        <p className="text-muted-foreground">View your top-up request history and current balance</p>
      </div>

      {/* Current Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            ${userBalance.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Available for top-up requests
          </p>
        </CardContent>
      </Card>

      {/* Top-up History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Top-up Request History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No top-up requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Top-up Amount</TableHead>
                  <TableHead>Total Transfer Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${request.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(request as any).user_balance_at_time ? ((request as any).user_balance_at_time).toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${request.fee ? request.fee.toFixed(2) : (request.status === 'approved' ? '0.00' : '-')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {request.transaction_id}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.note || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}