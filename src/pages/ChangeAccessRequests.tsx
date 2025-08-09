import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Eye, Check, X } from "lucide-react"

interface ChangeAccessRequest {
  id: string
  user_id: string
  ad_account_id: string | null
  description: string | null
  email: string | null
  status: string
  created_at: string
  user_email?: string
  account_name?: string
}

export default function ChangeAccessRequests() {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ChangeAccessRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ChangeAccessRequest | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchRequests = async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select(`
          id,
          user_id,
          ad_account_id,
          description,
          email,
          status,
          created_at
        `)
        .eq('request_type', 'change_access')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch user emails separately
      const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])]
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

      // Fetch account names separately
      const accountIds = [...new Set(requestsData?.filter(r => r.ad_account_id).map(r => r.ad_account_id) || [])]
      const { data: accountsData } = await supabase
        .from('ad_accounts')
        .select('id, account_name')
        .in('id', accountIds)

      const formattedRequests = requestsData?.map((request: any) => {
        const user = usersData?.find(u => u.id === request.user_id)
        const account = accountsData?.find(a => a.id === request.ad_account_id)
        
        return {
          ...request,
          user_email: user?.email,
          account_name: account?.account_name
        }
      }) || []

      setRequests(formattedRequests)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch change access requests"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [isAdmin])

  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      setIsUpdating(true)
      
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: "Request Updated",
        description: `Change access request has been ${status}.`,
      })

      fetchRequests()
      setIsViewOpen(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update request"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleViewRequest = (request: ChangeAccessRequest) => {
    setSelectedRequest(request)
    setIsViewOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading change access requests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Change Access Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No change access requests found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>New Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.user_email}</TableCell>
                    <TableCell>{request.account_name || 'N/A'}</TableCell>
                    <TableCell>{request.email || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change Access Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-base">{selectedRequest.user_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account</p>
                  <p className="text-base">{selectedRequest.account_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-base">
                    {new Date(selectedRequest.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">New Email Address</p>
                <Input 
                  value={selectedRequest.email || 'No email provided'} 
                  readOnly 
                />
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Reason/Details</p>
                <Textarea 
                  value={selectedRequest.description || 'No reason provided'} 
                  readOnly 
                  className="min-h-[100px]"
                />
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}