import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
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
import { Loader2, Eye, Check, X, Download, Filter, Search, Calendar } from "lucide-react"

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
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const fetchRequests = async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Create dummy replacement requests
      const dummyRequests: ReplacementRequest[] = [
        {
          id: 'replace-1',
          user_id: 'user-1',
          ad_account_id: '3',
          description: 'Account suspended due to policy violation. Need immediate replacement to continue campaigns.',
          screenshot_url: 'https://placehold.co/800x600/1a1a1a/ffffff?text=Account+Suspended',
          status: 'pending',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user_email: 'john.doe@example.com',
          account_name: 'Digital Media - 003 - 2245 - L003'
        },
        {
          id: 'replace-2',
          user_id: 'user-2',
          ad_account_id: '7',
          description: 'Previous account reached spending limit. Requesting new account for continued operations.',
          screenshot_url: null,
          status: 'approved',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          user_email: 'jane.smith@example.com',
          account_name: 'Premium Ads - 007 - 3201 - L007'
        },
        {
          id: 'replace-3',
          user_id: 'user-3',
          ad_account_id: '12',
          description: 'Account disabled without reason. Customer support not responsive.',
          screenshot_url: 'https://placehold.co/800x600/1a1a1a/ffffff?text=Account+Disabled',
          status: 'pending',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          user_email: 'mike.johnson@example.com',
          account_name: 'Fast Track - 012 - 4156 - L012'
        },
        {
          id: 'replace-4',
          user_id: 'user-4',
          ad_account_id: null,
          description: 'Technical issues preventing ad delivery. Need fresh account.',
          screenshot_url: null,
          status: 'rejected',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          user_email: 'sarah.wilson@example.com',
          account_name: undefined
        },
        {
          id: 'replace-5',
          user_id: 'user-5',
          ad_account_id: '15',
          description: 'Account under review for over 2 weeks. Cannot wait any longer.',
          screenshot_url: 'https://placehold.co/800x600/1a1a1a/ffffff?text=Under+Review',
          status: 'approved',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          user_email: 'david.brown@example.com',
          account_name: 'Growth Pro - 015 - 5289 - L015'
        }
      ]
      
      setRequests(dummyRequests)
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

  // Filtered and paginated requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesDate = !dateFilter || new Date(request.created_at).toISOString().split('T')[0] === dateFilter;
      const matchesSearch = !searchTerm || 
        request.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.description && request.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [requests, statusFilter, dateFilter, searchTerm]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

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

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
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
          <CardTitle className="text-2xl flex items-center gap-2">
            Replacement Requests
            <Badge className="ml-2 bg-primary text-primary-foreground">
              {filteredRequests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || dateFilter ? 'No requests match your filters' : 'No replacement requests found.'}
              </p>
            </div>
          ) : (
            <>
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
                  {paginatedRequests.map((request) => (
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
            </>
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
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="relative group">
                      <img 
                        src={selectedRequest.screenshot_url} 
                        alt="Request screenshot"
                        className="max-w-full h-auto rounded shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ maxHeight: '400px' }}
                        onClick={() => window.open(selectedRequest.screenshot_url!, '_blank')}
                        onError={(e) => {
                          console.error('Image failed to load:', selectedRequest.screenshot_url);
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<p class="text-destructive text-sm">Failed to load image. The image may have been deleted or is not accessible.</p>';
                          }
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded">
                        <Eye className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedRequest.screenshot_url!, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Full Size
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(selectedRequest.screenshot_url!);
                            if (!response.ok) throw new Error('Failed to fetch image');
                            
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `replacement-request-${selectedRequest.id}-screenshot.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Download failed:', error);
                            toast({
                              variant: "destructive",
                              title: "Download Failed",
                              description: "Unable to download the image. It may have been deleted or is not accessible.",
                            });
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
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