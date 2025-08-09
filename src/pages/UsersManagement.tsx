import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Users, ExternalLink, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  username?: string;
  telegram_username?: string;
  created_at: string;
  role: 'admin' | 'customer';
  totalTopupAmount?: number;
  availableBalance?: number;
  amountSpent?: number;
  feesPaid?: number;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    telegram_username: '',
    role: 'customer' as 'admin' | 'customer',
  });

  const fetchUsers = async () => {
    try {
      // Fetch user roles and join with users table
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Also fetch from users table to get additional info including new fields
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        console.error('Error fetching from users table:', usersError);
      }

      // Fetch financial data for each user
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('user_id, amount, fee, status');

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }

      // Fetch user balances
      const { data: balancesData, error: balancesError } = await supabase
        .from('user_balances')
        .select('user_id, balance');

      if (balancesError) {
        console.error('Error fetching balances:', balancesError);
      }

      // Create maps for user data and financial calculations
      const usersMap = new Map((usersData || []).map(u => [u.id, u]));
      const balancesMap = new Map((balancesData || []).map(b => [b.user_id, b.balance]));
      
      // Calculate financial data for each user
      const userFinancials = new Map();
      (paymentsData || []).forEach(payment => {
        if (!userFinancials.has(payment.user_id)) {
          userFinancials.set(payment.user_id, {
            totalTopupAmount: 0,
            feesPaid: 0,
            approvedAmount: 0
          });
        }
        
        const userFinancial = userFinancials.get(payment.user_id);
        if (payment.status === 'approved') {
          userFinancial.totalTopupAmount += (Number(payment.amount) || 0) + (Number(payment.fee) || 0);
          userFinancial.feesPaid += Number(payment.fee) || 0;
          userFinancial.approvedAmount += Number(payment.amount) || 0;
        }
      });

      // Build the final users list from user_roles as the source of truth
      const formattedUsers = userRolesData.map(userRole => {
        const userInfo = usersMap.get(userRole.user_id);
        const userFinancial = userFinancials.get(userRole.user_id) || {
          totalTopupAmount: 0,
          feesPaid: 0,
          approvedAmount: 0
        };
        const currentBalance = balancesMap.get(userRole.user_id) || 0;
        
        return {
          id: userRole.user_id,
          email: userInfo?.email || 'Unknown',
          username: userInfo?.username || '',
          telegram_username: userInfo?.telegram_username || '',
          created_at: userInfo?.created_at || new Date().toISOString(),
          role: userRole.role,
          totalTopupAmount: userFinancial.totalTopupAmount,
          availableBalance: userFinancial.approvedAmount,
          amountSpent: userFinancial.approvedAmount - Number(currentBalance),
          feesPaid: userFinancial.feesPaid,
        };
      });

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: updates.username,
          telegram_username: updates.telegram_username,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      fetchUsers();
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const createUser = async () => {
    if (!newUser.email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      // Call the create-user edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          role: newUser.role,
        }
      });

      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // If user created successfully, update the additional fields
      if (data?.user?.id && (newUser.username || newUser.telegram_username)) {
        await supabase
          .from('users')
          .update({
            username: newUser.username || null,
            telegram_username: newUser.telegram_username || null,
          })
          .eq('id', data.user.id);
      }

      toast({
        title: 'Success',
        description: `User created successfully: ${newUser.email}`,
      });

      setNewUser({ email: '', username: '', telegram_username: '', role: 'customer' });
      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered users based on search and role filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.telegram_username && user.telegram_username.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="telegram_username">Telegram Username</Label>
                <Input
                  id="telegram_username"
                  type="text"
                  placeholder="@telegram_username"
                  value={newUser.telegram_username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, telegram_username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'customer') => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createUser} disabled={isCreating} className="w-full">
                {isCreating ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by email, username, or telegram username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={(value: 'all' | 'admin' | 'customer') => setRoleFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="customer">Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Telegram Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Total Top-up (Incl. Fee)</TableHead>
                  <TableHead>Available Balance</TableHead>
                  <TableHead>Amount Spent</TableHead>
                  <TableHead>Fees Paid</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {editingUser?.id === user.id ? (
                        <Input
                          value={editingUser.username || ''}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                          className="w-24"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateUser(user.id, editingUser);
                            } else if (e.key === 'Escape') {
                              setEditingUser(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-primary"
                          onClick={() => setEditingUser(user)}
                        >
                          {user.username || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser?.id === user.id ? (
                        <Input
                          value={editingUser.telegram_username || ''}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, telegram_username: e.target.value } : null)}
                          className="w-32"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateUser(user.id, editingUser);
                            } else if (e.key === 'Escape') {
                              setEditingUser(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-primary"
                          onClick={() => setEditingUser(user)}
                        >
                          {user.telegram_username || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    {user.role === 'customer' ? (
                      <>
                        <TableCell>${(user.totalTopupAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>${(user.availableBalance || 0).toFixed(2)}</TableCell>
                        <TableCell>${(user.amountSpent || 0).toFixed(2)}</TableCell>
                        <TableCell>${(user.feesPaid || 0).toFixed(2)}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingUser?.id === user.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUser(user.id, editingUser)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser(user)}
                            >
                              Edit
                            </Button>
                            {user.role === 'customer' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/user-dashboard/${user.id}`, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Dashboard
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}