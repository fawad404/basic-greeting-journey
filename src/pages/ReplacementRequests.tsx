import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { Loader2, Eye, Check, X, Download } from "lucide-react"

interface ReplacementRequest {
  id: string
  user_id: string
  ad_account_id: string | null
  description: string | null
  screenshot_url: string | null
  status: string
  created_at: string
  user_email?: string
  account_name?: string
}

export default function ReplacementRequests() {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ReplacementRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ReplacementRequest | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchRequests = async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select(`
          *,
          users!inner(email),
          ad_accounts(account_name)
        `)
        .eq('request_type', 'replacement')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedRequests = requestsData?.map((request: any) => ({
        ...request,
        user_email: request.users?.email,
        account_name: request.ad_accounts?.account_name
      })) || []

      setRequests(formattedRequests)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch replacement requests"
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
        description: `Replacement request has been ${status}.`,
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

  const handleViewRequest = (request: ReplacementRequest) => {
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
          <span>Loading replacement requests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Replacement Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No replacement requests found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Account</TableHead>
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
            <DialogTitle>Replacement Request Details</DialogTitle>
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
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <Textarea 
                  value={selectedRequest.description || 'No description provided'} 
                  readOnly 
                  className="min-h-[100px]"
                />
              </div>

              {selectedRequest.screenshot_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Screenshot</p>
                  <div className="border rounded-lg p-4">
                    <img 
                      src={selectedRequest.screenshot_url} 
                      alt="Request screenshot"
                      className="max-w-full h-auto rounded"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(selectedRequest.screenshot_url!, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

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