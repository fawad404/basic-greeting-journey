import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface AdAccount {
  id: string;
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
  updated_at: string;
  user_id: string;
}

export default function AdAccounts() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [topUpAmount, setTopUpAmount] = useState("")
  const [replaceReason, setReplaceReason] = useState("")
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  const [isReplaceOpen, setIsReplaceOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchAccounts()
  }, [user])

  const fetchAccounts = async () => {
    if (!user) return

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userData) {
        const { data: accountsData } = await supabase
          .from('ad_accounts')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })

        setAccounts((accountsData as AdAccount[]) || [])
        if (accountsData && accountsData.length > 0) {
          setSelectedAccount(accountsData[0] as AdAccount)
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch ad accounts"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAccounts = accounts.filter(account =>
    account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_id.includes(searchTerm)
  )

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Top-up Request Submitted",
      description: `Request for $${topUpAmount} has been submitted for review.`,
    })
    setTopUpAmount("")
    setIsTopUpOpen(false)
  }

  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAccount || !user) return

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userData) {
        const { error } = await supabase
          .from('account_replacement_requests')
          .insert([{
            user_id: userData.id,
            ad_account_id: selectedAccount.id,
            reason: replaceReason
          }])

        if (error) throw error

        toast({
          title: "Replacement Request Submitted",
          description: "Your account replacement request has been submitted for review.",
        })
        setReplaceReason("")
        setIsReplaceOpen(false)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit replacement request"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar - Account List */}
        <div className="w-full lg:w-1/3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ad Accounts</h2>
            <span className="text-sm text-muted-foreground">{accounts.length}</span>
          </div>
          
          <div className="relative">
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3"
            />
          </div>

          <ScrollArea className="h-96">
            {filteredAccounts.map((account) => (
              <Card 
                key={account.id} 
                className={`mb-3 cursor-pointer transition-colors ${
                  selectedAccount?.id === account.id ? 'border-primary bg-accent' : ''
                }`}
                onClick={() => setSelectedAccount(account)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{account.account_name}</h3>
                    <Badge variant={account.status === "active" ? "default" : "destructive"}>
                      {account.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{account.account_id}</p>
                  <p className="text-xs font-medium">${account.budget.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(account.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
            {filteredAccounts.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {accounts.length === 0 ? "No ad accounts found. Contact admin to get an account assigned." : "No accounts match your search."}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right side - Account Details */}
        <div className="col-span-2">
          {selectedAccount ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">{selectedAccount.account_name}</h1>
                  <p className="text-muted-foreground">Account ID: {selectedAccount.account_id}</p>
                </div>
              </div>

              <div className="grid gap-6">
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Creation Date:</p>
                        <p className="font-medium">{new Date(selectedAccount.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Topup Amount:</p>
                        <p className="font-medium">${selectedAccount.total_topup_amount}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Access Email:</p>
                      <p className="font-medium">{selectedAccount.access_email}</p>
                    </div>
                    <div className="flex gap-3">
                      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                        <DialogTrigger asChild>
                          <Button>Top-Up</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Top-Up Account</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleTopUpSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="amount">Amount ($)</Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                                placeholder="Enter amount"
                                required
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsTopUpOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">Submit Request</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {selectedAccount.status === 'suspended' && (
                        <Dialog open={isReplaceOpen} onOpenChange={setIsReplaceOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline">Replace</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Request Account Replacement</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleReplaceSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="reason">Reason for Replacement</Label>
                                <Textarea
                                  id="reason"
                                  value={replaceReason}
                                  onChange={(e) => setReplaceReason(e.target.value)}
                                  placeholder="Please explain why you need account replacement..."
                                  required
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsReplaceOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit">Submit Request</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button variant="outline">Change Access</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Location & Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-blue-500">🌐</span>
                      Location & Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Country</p>
                        <p className="font-medium">{selectedAccount.country}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Timezone</p>
                        <p className="font-medium">{selectedAccount.timezone}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Currency</p>
                      <p className="font-medium">{selectedAccount.currency}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-blue-500">⏰</span>
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Created Date</p>
                        <p className="font-medium">{new Date(selectedAccount.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{new Date(selectedAccount.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">
                {accounts.length === 0 ? "No ad accounts found. Contact admin to get an account assigned." : "Select an account to view details."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}