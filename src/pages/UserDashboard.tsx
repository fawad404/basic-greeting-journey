import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  CreditCard, 
  Users, 
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface UserBalance {
  balance: number;
}

interface AdAccount {
  id: string;
  account_name: string;
  account_id: string | null;
  status: string | null;
  platform: string | null;
  budget?: number | null;
  total_topup_amount?: number | null;
  created_at: string;
}

interface TopUpRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function UserDashboard() {
  const { userId } = useParams();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can view user dashboards',
        variant: 'destructive',
      });
      return;
    }

    const fetchUserData = async () => {
      if (!userId) return;

      try {
        // Fetch user info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setUser(userData);

        // Fetch user balance
        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (!balanceError && balanceData) {
          setUserBalance(balanceData);
        }

        // Fetch ad accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('ad_accounts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!accountsError && accountsData) {
          setAdAccounts(accountsData);
        }

        // Fetch top-up requests (using payments table for now)
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!paymentsError && paymentsData) {
          setTopUpRequests(paymentsData.map(p => ({
            id: p.id,
            amount: p.amount,
            status: p.status,
            created_at: p.created_at
          })));
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch user data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can view user dashboards</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground">The requested user could not be found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* User Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.email}</h1>
          <p className="text-muted-foreground">
            Member since {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto">
          Admin View
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${userBalance?.balance?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adAccounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${adAccounts.reduce((sum, acc) => sum + acc.total_topup_amount, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topUpRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ad Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ad Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adAccounts.length > 0 ? (
            <div className="space-y-4">
              {adAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{account.account_name}</h3>
                    <p className="text-sm text-muted-foreground">{account.account_id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">${account.budget.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Budget</p>
                    </div>
                    <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                      {account.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No ad accounts found</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Top-up Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Top-up Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topUpRequests.length > 0 ? (
            <div className="space-y-4">
              {topUpRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">${request.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={
                    request.status === 'approved' ? 'default' : 
                    request.status === 'rejected' ? 'destructive' : 
                    'secondary'
                  }>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No top-up requests found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}