import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { CheckCircle, XCircle, Clock, FileText, Filter, Search, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { TestTelegramButton } from "@/components/TestTelegramButton"
import { SetupTelegramWebhookButton } from "@/components/SetupTelegramWebhookButton"
import { DeleteTelegramWebhookButton } from "@/components/DeleteTelegramWebhookButton"

// Function to update Telegram message when status changes
const updateTelegramMessage = async (transactionId: string, status: 'approved' | 'rejected', userEmail: string, amount: number) => {
  try {
    const { error } = await supabase.functions.invoke('update-telegram-message', {
      body: {
        transactionId,
        status,
        userEmail,
        amount
      }
    })

    if (error) {
      console.error('Error updating Telegram message:', error)
    } else {
      console.log(`✅ Telegram message updated for ${transactionId} - ${status}`)
    }
  } catch (error) {
    console.error('Error calling update-telegram-message function:', error)
  }
}

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
  const [searchParams] = useSearchParams()
  const highlightTransactionId = searchParams.get('transaction')
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const fetchRequests = async () => {
    try {
      // Get all top-up requests (identified by transaction_id starting with 'TOPUP-')
      const { data: requestsData, error: requestsError } = await supabase
        .from('payments')
        .select('*')
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

  // Filtered and paginated requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesDate = !dateFilter || new Date(request.created_at).toISOString().split('T')[0] === dateFilter;
      const matchesSearch = !searchTerm || 
        request.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.note && request.note.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [requests, statusFilter, dateFilter, searchTerm]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

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

      // Update Telegram message
      await updateTelegramMessage(request.transaction_id, 'approved', request.user_email, request.amount)

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

  const handleReject = async (request: TopUpRequest) => {
    try {
      console.log('⚠️ REJECTION: Only updating payment status to rejected')
      
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (error) throw error

      console.log('✅ REJECTION: Payment status updated to rejected')

      // Update Telegram message
      await updateTelegramMessage(request.transaction_id, 'rejected', request.user_email!, request.amount)

      toast({
        title: "Request Rejected",
        description: `Top-up request has been rejected`,
      })

      // Refresh the requests list
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
        <div className="flex gap-2">
          <SetupTelegramWebhookButton />
          <DeleteTelegramWebhookButton />
          <TestTelegramButton />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'approved' | 'rejected') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('');
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Top-up Requests
            <Badge className="ml-2 bg-primary text-primary-foreground">
              {filteredRequests.length}
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
              {paginatedRequests.map((request) => (
                <TableRow 
                  key={request.id} 
                  className={highlightTransactionId === request.transaction_id ? "bg-primary/10 border-primary" : ""}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.user_email}</div>
                      <div className="text-xs text-muted-foreground">ID: {request.user_id.substring(0, 8)}...</div>
                      {highlightTransactionId === request.transaction_id && (
                        <Badge variant="outline" className="mt-1 text-xs bg-primary/10 text-primary border-primary">
                          📍 From Telegram
                        </Badge>
                      )}
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
                    {request.status === 'pending' && (
                      <Badge className="bg-warning text-warning-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {request.status === 'approved' && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                    {request.status === 'rejected' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
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
                          onClick={() => handleReject(request)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status !== 'pending' && (
                      <span className="text-muted-foreground text-sm">
                        {request.status === 'approved' ? 'Completed' : 'Rejected'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateFilter ? 'No requests match your filters' : 'No top-up requests found'}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}