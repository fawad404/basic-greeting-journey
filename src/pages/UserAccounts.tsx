import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Pencil, Plus, Search, Filter } from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface User {
  id: string;
  email: string;
  username?: string;
  telegram_username?: string;
}

interface AdAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_id: string;
  status: string;
  budget: number;
  total_topup_amount: number;
  total_topup_with_fees: number;
  access_email: string;
  country: string;
  timezone: string;
  currency: string;
  created_at: string;
  users?: { email: string } | null;
}

export default function UserAccounts() {
  // ALL hooks declared first - never conditional
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AdAccount | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    account_name: '',
    account_id: '',
    status: 'active',
    total_topup: 0,
    access_email: '',
    timezone: 'UTC'
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Filtered accounts based on search and status filter
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = searchTerm === '' || 
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.users?.email && account.users.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        account.access_email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [accounts, searchTerm, statusFilter]);

  // Paginated accounts
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchData()
    }
  }, [authLoading, isAdmin])

  const fetchData = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Create dummy users
      const dummyUsers: User[] = [
        { id: 'user-1', email: 'john.doe@example.com', username: 'john_doe', telegram_username: '@johndoe' },
        { id: 'user-2', email: 'jane.smith@example.com', username: 'jane_smith', telegram_username: '@janesmith' },
        { id: 'user-3', email: 'mike.johnson@example.com', username: 'mike_j', telegram_username: '@mikejohnson' },
        { id: 'user-4', email: 'sarah.wilson@example.com', username: 'sarah_w', telegram_username: '@sarahwilson' },
        { id: 'user-5', email: 'david.brown@example.com', username: 'david_brown', telegram_username: '@davidb' }
      ]
      
      // Create dummy ad accounts
      const dummyAccounts: AdAccount[] = [
        {
          id: '1',
          user_id: 'user-1',
          account_name: 'Ads Agency - 001 - 1945 - L001',
          account_id: '106-201-1997',
          status: 'active',
          budget: 5000,
          total_topup_amount: 12500,
          total_topup_with_fees: 13000,
          access_email: 'admin@adsagency.com',
          country: 'United States',
          timezone: 'America/New_York',
          currency: 'USD',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          users: { email: 'john.doe@example.com' }
        },
        {
          id: '2',
          user_id: 'user-1',
          account_name: 'Marketing Pro - 002 - 2103 - L002',
          account_id: '107-302-1998',
          status: 'active',
          budget: 7500,
          total_topup_amount: 18000,
          total_topup_with_fees: 18900,
          access_email: 'admin@marketingpro.com',
          country: 'United Kingdom',
          timezone: 'Europe/London',
          currency: 'GBP',
          created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          users: { email: 'john.doe@example.com' }
        },
        {
          id: '3',
          user_id: 'user-2',
          account_name: 'Digital Media - 003 - 2245 - L003',
          account_id: '108-403-1999',
          status: 'suspended',
          budget: 3200,
          total_topup_amount: 8500,
          total_topup_with_fees: 8925,
          access_email: 'admin@digitalmedia.com',
          country: 'Canada',
          timezone: 'America/Toronto',
          currency: 'CAD',
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          users: { email: 'jane.smith@example.com' }
        },
        {
          id: '4',
          user_id: 'user-3',
          account_name: 'Social Boost - 004 - 2387 - L004',
          account_id: '109-504-2000',
          status: 'active',
          budget: 9200,
          total_topup_amount: 22000,
          total_topup_with_fees: 23100,
          access_email: 'admin@socialboost.com',
          country: 'Australia',
          timezone: 'Australia/Sydney',
          currency: 'AUD',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          users: { email: 'mike.johnson@example.com' }
        },
        {
          id: '5',
          user_id: 'user-4',
          account_name: 'Growth Hub - 005 - 2529 - L005',
          account_id: '110-605-2001',
          status: 'active',
          budget: 6800,
          total_topup_amount: 15000,
          total_topup_with_fees: 15750,
          access_email: 'admin@growthhub.com',
          country: 'Germany',
          timezone: 'Europe/Berlin',
          currency: 'EUR',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          users: { email: 'sarah.wilson@example.com' }
        }
      ]
      
      setUsers(dummyUsers)
      setFilteredUsers(dummyUsers)
      setAccounts(dummyAccounts)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data"
      })
    } finally {
      setLoading(false)
    }
  }

  // Search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    
    if (query.trim() === '') {
      setFilteredUsers(users)
      setShowSearchResults(false)
    } else {
      const filtered = users.filter(user => 
        (user.username?.toLowerCase().includes(query)) ||
        (user.telegram_username?.toLowerCase().includes(query)) ||
        (user.email?.toLowerCase().includes(query))
      )
      setFilteredUsers(filtered)
      setShowSearchResults(true)
    }
  }

  const handleSearchUserSelect = (user: User) => {
    setFormData({ ...formData, user_id: user.id })
    setSearchQuery(user.username || user.telegram_username || user.email)
    setShowSearchResults(false)
  }

  const handleUserSelect = (userId: string) => {
    setFormData({ ...formData, user_id: userId })
  }

  const handleSearchFocus = () => {
    if (searchQuery.trim() !== '') {
      setShowSearchResults(true)
    }
  }

  const handleSearchBlur = () => {
    // Delay hiding to allow click on search results
    setTimeout(() => setShowSearchResults(false), 200)
  }

  const resetForm = () => {
    setFormData({
      user_id: '',
      account_name: '',
      account_id: '',
      status: 'active',
      total_topup: 0,
      access_email: '',
      timezone: 'UTC'
    })
    setEditingAccount(null)
    setSearchQuery('')
    setFilteredUsers(users)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingAccount) {
        // Update existing account
        const updateData = {
          ...formData,
          total_topup_amount: formData.total_topup
        }
        
        const { error } = await supabase
          .from('ad_accounts')
          .update(updateData)
          .eq('id', editingAccount.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Ad account updated successfully"
        })
      } else {
        // Create new account
        const insertData = {
          ...formData,
          total_topup_amount: formData.total_topup
        }
        
        const { error: insertError } = await supabase
          .from('ad_accounts')
          .insert([insertData])

        if (insertError) throw insertError

        // Handle user balance update if total_topup > 0
        if (formData.total_topup > 0) {
          // Check if user already has a balance record
          const { data: existingBalance, error: balanceCheckError } = await supabase
            .from('user_balances')
            .select('*')
            .eq('user_id', formData.user_id)
            .single()

          if (balanceCheckError && balanceCheckError.code !== 'PGRST116') {
            throw balanceCheckError
          }

          if (existingBalance) {
            // User has existing balance - add to it
            const { error: updateBalanceError } = await supabase
              .from('user_balances')
              .update({ 
                balance: existingBalance.balance + formData.total_topup,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', formData.user_id)

            if (updateBalanceError) throw updateBalanceError
          } else {
            // New user - create initial balance
            const { error: createBalanceError } = await supabase
              .from('user_balances')
              .insert([{
                user_id: formData.user_id,
                balance: formData.total_topup
              }])

            if (createBalanceError) throw createBalanceError
          }
        }

        toast({
          title: "Success", 
          description: "Ad account created successfully and user balance updated"
        })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving account:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save ad account"
      })
    }
  }

  const handleEdit = (account: AdAccount) => {
    setEditingAccount(account)
    setFormData({
      user_id: account.user_id,
      account_name: account.account_name,
      account_id: account.account_id,
      status: account.status as 'active' | 'suspended',
      total_topup: account.total_topup_amount,
      access_email: account.access_email,
      timezone: account.timezone
    })
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleAddNew = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Early returns after all hooks are declared
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          <p className="text-xs text-muted-foreground mt-2">Current user: {user?.email}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading data...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Accounts Management</h1>
          <p className="text-muted-foreground">Manage ad accounts for users</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Account
          </Button>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-background border border-border z-50">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit Ad Account' : 'Add New Ad Account'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_search">Search & Select User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user_search"
                    placeholder="Search by username, telegram username, or email..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="pl-10"
                  />
                  {/* Live search results dropdown */}
                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="px-3 py-2 hover:bg-accent cursor-pointer text-sm border-b border-border last:border-b-0"
                            onClick={() => handleSearchUserSelect(user)}
                          >
                            <div className="font-medium">
                              {user.username || user.telegram_username || user.email}
                            </div>
                            {user.email && user.email !== (user.username || user.telegram_username) && (
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No users found matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Select 
                  value={formData.user_id} 
                  onValueChange={handleUserSelect}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50 max-h-[200px]">
                    {users.map((user) => (
                      <SelectItem 
                        key={user.id} 
                        value={user.id}
                        className="bg-background hover:bg-accent focus:bg-accent"
                      >
                        {user.username || user.telegram_username || user.email}
                      </SelectItem>
                    ))}
                    {users.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No customer users found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g., Ads Forilla - 001 - 1945 - Lxxx"
                  required
                />
              </div>

              <div>
                <Label htmlFor="account_id">Account ID</Label>
                <Input
                  id="account_id"
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  placeholder="e.g., 106-201-1997"
                  required
                />
              </div>

              <div>
                <Label htmlFor="access_email">Access Email</Label>
                <Input
                  id="access_email"
                  type="email"
                  value={formData.access_email}
                  onChange={(e) => setFormData({ ...formData, access_email: e.target.value })}
                  placeholder="test@gmail.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="total_topup">Total Top-up</Label>
                <Input
                  id="total_topup"
                  type="number"
                  step="0.01"
                  value={formData.total_topup}
                  onChange={(e) => setFormData({ ...formData, total_topup: parseFloat(e.target.value) || 0 })}
                  placeholder="500.00"
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="UTC"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'active' | 'suspended') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="active" className="bg-background hover:bg-accent focus:bg-accent">Active</SelectItem>
                    <SelectItem value="suspended" className="bg-background hover:bg-accent focus:bg-accent">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by account name, account ID, user email, or access email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'suspended') => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Ad Accounts ({filteredAccounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Top-up Amount (Incl. Fees)</TableHead>
                <TableHead>Access Email</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.account_name}</TableCell>
                  <TableCell>{account.account_id}</TableCell>
                  <TableCell>{account.users?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${account.total_topup_with_fees.toFixed(2)}</TableCell>
                  <TableCell>{account.access_email}</TableCell>
                  <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(account)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' ? 'No accounts match your search criteria' : 'No ad accounts found'}
                  </TableCell>
                </TableRow>
              )}
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
        </CardContent>
      </Card>
    </div>
  )
}