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
import { Pencil, Plus, Search } from "lucide-react"

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

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchData()
    }
  }, [authLoading, isAdmin])

  const fetchData = async () => {
    try {
      console.log('Fetching users and accounts...')
      
      // First fetch all user roles to get customer user IDs
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'customer')

      if (userRolesError) {
        console.error('Error fetching user roles:', userRolesError)
        throw userRolesError
      }

      const customerUserIds = userRolesData?.map(ur => ur.user_id) || []

      if (customerUserIds.length === 0) {
        console.log('No customer users found')
        setUsers([])
        setFilteredUsers([])
        setAccounts([])
        setLoading(false)
        return
      }

      // Fetch only customer users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, username, telegram_username')
        .in('id', customerUserIds)
        .order('email')

      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }

      // Fetch ad accounts with user info
      const { data: accountsData, error: accountsError } = await supabase
        .from('ad_accounts')
        .select(`
          *,
          users:user_id (email)
        `)
        .order('created_at', { ascending: false })

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError)
        throw accountsError
      }

      console.log('Fetched users:', usersData)
      console.log('Fetched accounts:', accountsData)
      console.log('Current user is admin:', isAdmin)
      console.log('Auth loading state:', authLoading)
      
      const customerUsers = usersData || []
      setUsers(customerUsers)
      setFilteredUsers(customerUsers)
      setAccounts((accountsData as any) || [])
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

      <Card>
        <CardHeader>
          <CardTitle>All Ad Accounts ({accounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Top-up</TableHead>
                <TableHead>Access Email</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.account_name}</TableCell>
                  <TableCell>{account.account_id}</TableCell>
                  <TableCell>{account.users?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${account.total_topup_amount.toFixed(2)}</TableCell>
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
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No ad accounts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}