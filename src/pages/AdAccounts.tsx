import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TopUpDialog } from "@/components/TopUpDialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Search, MapPin, Clock, Calendar, Loader2 } from "lucide-react"

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
  console.log('AdAccounts component loaded - version 2.0')
  const { toast } = useToast()
  const { user } = useAuth()
  
  // Declare all useState hooks first - always in the same order
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [topUpAmount, setTopUpAmount] = useState("")
  const [replaceReason, setReplaceReason] = useState("")
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  const [isReplaceOpen, setIsReplaceOpen] = useState(false)
  const [isChangeAccessOpen, setIsChangeAccessOpen] = useState(false)
  const [changeAccessEmail, setChangeAccessEmail] = useState("")
  const [changeAccessReason, setChangeAccessReason] = useState("")
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [isSubmittingReplace, setIsSubmittingReplace] = useState(false)
  const [isSubmittingChangeAccess, setIsSubmittingChangeAccess] = useState(false)

  // Define fetchAccounts function with useCallback to prevent recreation on every render
  const fetchAccounts = useCallback(async () => {
    if (!user?.email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true) // Ensure loading is true during fetch
      
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
  }, [user?.email, toast])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const filteredAccounts = accounts.filter(account =>
    account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_id.includes(searchTerm)
  )

  const handleTopUpClick = (account: AdAccount) => {
    setSelectedAccount(account)
    setIsTopUpOpen(true)
  }

  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAccount || !user || isSubmittingReplace) return

    try {
      setIsSubmittingReplace(true)
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userData) {
        // Check for existing pending requests
        const { data: existingRequest } = await supabase
          .from('requests')
          .select('id, status')
          .eq('user_id', userData.id)
          .eq('ad_account_id', selectedAccount.id)
          .eq('request_type', 'replacement')
          .eq('status', 'pending')
          .single()

        if (existingRequest) {
          toast({
            variant: "destructive",
            title: "Request Already Exists",
            description: "You already have a pending replacement request for this account. Please wait for approval.",
          })
          return
        }

        let screenshotUrl = null

        // Upload screenshot if provided
        if (screenshotFile) {
          const fileExt = screenshotFile.name.split('.').pop()
          const fileName = `${userData.id}/${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('request-screenshots')
            .upload(fileName, screenshotFile)

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from('request-screenshots')
            .getPublicUrl(fileName)
          
          screenshotUrl = urlData.publicUrl
        }

        const { error } = await supabase
          .from('requests')
          .insert([{
            user_id: userData.id,
            ad_account_id: selectedAccount.id,
            request_type: 'replacement',
            description: replaceReason,
            screenshot_url: screenshotUrl
          }])

        if (error) throw error

        toast({
          title: "Replacement Request Submitted",
          description: "Your account replacement request has been submitted for review.",
        })
        setReplaceReason("")
        setScreenshotFile(null)
        setIsReplaceOpen(false)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit replacement request"
      })
    } finally {
      setIsSubmittingReplace(false)
    }
  }

  const handleChangeAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAccount || !user || isSubmittingChangeAccess) return

    try {
      setIsSubmittingChangeAccess(true)
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userData) {
        // Check for existing pending requests
        const { data: existingRequest } = await supabase
          .from('requests')
          .select('id, status')
          .eq('user_id', userData.id)
          .eq('ad_account_id', selectedAccount.id)
          .eq('request_type', 'change_access')
          .eq('status', 'pending')
          .single()

        if (existingRequest) {
          toast({
            variant: "destructive",
            title: "Request Already Exists",
            description: "You already have a pending change access request for this account. Please wait for approval.",
          })
          return
        }

        const { error } = await supabase
          .from('requests')
          .insert([{
            user_id: userData.id,
            ad_account_id: selectedAccount.id,
            request_type: 'change_access',
            description: changeAccessReason,
            email: changeAccessEmail
          }])

        if (error) throw error

        toast({
          title: "Change Access Request Submitted",
          description: "Your change access request has been submitted for review.",
        })
        setChangeAccessEmail("")
        setChangeAccessReason("")
        setIsChangeAccessOpen(false)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit change access request"
      })
    } finally {
      setIsSubmittingChangeAccess(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Left Sidebar - Loading Skeleton */}
          <div className="w-96 border-r border-border bg-card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-5 w-8" />
              </div>
              
              <div className="relative mb-6">
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-32 mb-2" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Loading */}
          <div className="flex-1 bg-background flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading ad accounts...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Left Sidebar - Account List */}
        <div className="w-96 border-r border-border bg-card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Ad Accounts</h2>
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {accounts.length}
              </Badge>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3">
                {filteredAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                      selectedAccount?.id === account.id 
                        ? 'border-primary bg-primary/10 shadow-md' 
                        : 'border-border bg-card hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedAccount(account)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm text-foreground leading-tight">
                        {account.account_name}
                      </h3>
                      <Badge 
                        variant={account.status === "active" ? "default" : "destructive"}
                        className="text-xs ml-2"
                      >
                        {account.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{account.account_id}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium text-foreground">${account.budget.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(account.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredAccounts.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="text-sm">
                      {accounts.length === 0 
                        ? "No ad accounts found. Contact admin to get an account assigned." 
                        : "No accounts match your search."
                      }
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Side - Account Details */}
        <div className="flex-1 bg-background">
          {selectedAccount ? (
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {selectedAccount.account_name}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Account ID: {selectedAccount.account_id}
                </p>
              </div>

              <div className="space-y-6">
                {/* Account Information Card */}
                <Card className="border-border">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-foreground">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Creation Date:</p>
                        <p className="text-lg font-semibold text-foreground">
                          {new Date(selectedAccount.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Topup Amount:</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${selectedAccount.total_topup_amount}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Access Email:</p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedAccount.access_email}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={() => handleTopUpClick(selectedAccount)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Top-Up
                      </Button>

                      <Dialog open={isReplaceOpen} onOpenChange={setIsReplaceOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-muted-foreground">
                            Replace
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request Account Replacement</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleReplaceSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="reason">Description of Issue *</Label>
                              <Textarea
                                id="reason"
                                value={replaceReason}
                                onChange={(e) => setReplaceReason(e.target.value)}
                                placeholder="Please explain why you need account replacement..."
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="screenshot">Screenshot (Optional)</Label>
                              <Input
                                id="screenshot"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                                className="cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Upload a screenshot to help explain the issue (images only)
                              </p>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsReplaceOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isSubmittingReplace}>
                                {isSubmittingReplace ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Request'
                                )}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isChangeAccessOpen} onOpenChange={setIsChangeAccessOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-muted-foreground">
                            Change Access
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request Access Change</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleChangeAccessSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="newEmail">New Email Address *</Label>
                              <Input
                                id="newEmail"
                                type="email"
                                value={changeAccessEmail}
                                onChange={(e) => setChangeAccessEmail(e.target.value)}
                                placeholder="Enter the new email address..."
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="accessReason">Reason/Request Details *</Label>
                              <Textarea
                                id="accessReason"
                                value={changeAccessReason}
                                onChange={(e) => setChangeAccessReason(e.target.value)}
                                placeholder="Please explain why you need to change access..."
                                required
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsChangeAccessOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isSubmittingChangeAccess}>
                                {isSubmittingChangeAccess ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Request'
                                )}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Location & Settings Card */}
                <Card className="border-border">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-foreground flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location & Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Country</p>
                        <p className="text-lg font-semibold text-foreground">{selectedAccount.country}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Timezone</p>
                        <p className="text-lg font-semibold text-foreground">{selectedAccount.timezone}</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Currency</p>
                      <p className="text-lg font-semibold text-foreground">{selectedAccount.currency}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Card */}
                <Card className="border-border">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-foreground flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Created Date</p>
                        <p className="text-lg font-semibold text-foreground">
                          {new Date(selectedAccount.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                        <p className="text-lg font-semibold text-foreground">
                          {new Date(selectedAccount.updated_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-xl text-muted-foreground mb-2">
                  {accounts.length === 0 
                    ? "No ad accounts found" 
                    : "Select an account to view details"
                  }
                </p>
                {accounts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Contact admin to get an account assigned.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top-up Dialog */}
      <TopUpDialog 
        open={isTopUpOpen}
        onOpenChange={setIsTopUpOpen}
        accountId={selectedAccount?.account_id}
        accountName={selectedAccount?.account_name}
      />
    </div>
  )
}