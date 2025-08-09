import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TestTelegramButton } from "@/components/TestTelegramButton"

interface TopUpRequest {
  id: string
  user_id: string
  amount: number
  transaction_id: string
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  user_email?: string
}

export default function TopUpRequests() {
  const [requests, setRequests] = useState<TopUpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchRequests = async () => {
    try {
      // Get pending top-up requests only (identified by transaction_id starting with 'TOPUP-')
      const { data: requestsData, error: requestsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .like('transaction_id', 'TOPUP-%')
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError

      // Get user emails for each request
      const requestsWithEmails = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', request.user_id)
            .single()

          return {
            ...request,
            user_email: userData?.email || 'Unknown'
          }
        })
      )

      setRequests(requestsWithEmails as TopUpRequest[])
    } catch (error) {
      console.error('Error fetching top-up requests:', error)
      toast({
        title: "Error",
        description: "Failed to fetch top-up requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // CRITICAL: This function ONLY updates the payment status - NO BALANCE CALCULATIONS OR UPDATES
  const handleApproval = async (request: TopUpRequest) => {
    try {
      console.log('⚠️ APPROVAL: Only updating payment status - NO balance changes')
      
      // ONLY update the payment status - nothing else
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (error) throw error

      console.log('✅ APPROVAL: Payment status updated to approved - balance remains unchanged')

      toast({
        title: "Request Approved",
        description: `Top-up request approved successfully. User balance calculation handled automatically.`,
      })

      // Refresh the requests list
      fetchRequests()
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      console.log('⚠️ REJECTION: Only updating payment status to rejected')
      
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      console.log('✅ REJECTION: Payment status updated to rejected')

      toast({
        title: "Request Rejected",
        description: `Top-up request has been rejected`,
      })

      fetchRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading top-up requests...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Top-up Requests</h1>
          <p className="text-muted-foreground">Approve or reject pending top-up requests from users</p>
        </div>
        <TestTelegramButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Requests
            <Badge className="ml-2 bg-warning text-warning-foreground">
              {requests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Request ID</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.user_email}</div>
                      <div className="text-xs text-muted-foreground">ID: {request.user_id.substring(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-lg">${request.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {request.transaction_id}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={request.note || ''}>
                      {request.note || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-warning text-warning-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApproval(request)}
                        className="bg-success hover:bg-success/80"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending top-up requests
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}