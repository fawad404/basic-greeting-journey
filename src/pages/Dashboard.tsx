import { MetricCard } from "@/components/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckCircle2, DollarSign, Wallet, CreditCard, TrendingUp, ArrowUpRight, Users, BarChart3, Shield, Zap, ArrowRightLeft, Building2, CalendarIcon } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { useState, useEffect } from "react"
import { format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, parseISO } from "date-fns"

const transactions = [
  { company: "Google Ads Spending", date: "26 February", amount: "+$815.60", avatar: "G", bgColor: "bg-blue-500" },
  { company: "Meta Spending", date: "24 February", amount: "+$782", avatar: "M", bgColor: "bg-purple-500" },
  { company: "TikTok Spending", date: "24 February", amount: "+$460.75", avatar: "T", bgColor: "bg-teal-500" },
  { company: "Other Spending", date: "23 February", amount: "+$923.40", avatar: "O", bgColor: "bg-orange-500" },
]

const teamMembers = [
  { name: "Bobbie Nader", role: "Admin, cardholder", category: "Office supplies", group: "Product Launch", avatar: "BN" },
  { name: "Emily Johnson", role: "Cardholder, accountant", category: "Marketing", group: "R&D Funding", avatar: "EJ" },
  { name: "Michael Brown", role: "Admin, accountant", category: "Travel", group: "Sales Team", avatar: "MB" },
  { name: "Sophia Lee", role: "Admin, accountant", category: "Stack, Linear", group: "Product Launch", avatar: "SL" },
]

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
  const [dateFilter, setDateFilter] = useState("thismonth")
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()
  const [spendChartData, setSpendChartData] = useState([])
  
  const [metrics, setMetrics] = useState({
    totalTransferAmount: 0,
    totalTopupAmount: 0,
    accountCount: 0,
    totalSpending: 0
  })
  const [adminMetrics, setAdminMetrics] = useState({
    totalAccounts: 0,
    totalTopupAmount: 0,
    suspendedAccounts: 0,
    totalSpending: 0,
    totalServiceFees: 0
  })

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (dateFilter) {
      case "thismonth":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case "2months":
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(now)
        break
      case "1year":
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        break
      case "custom":
        // Only use custom dates if both are selected, otherwise fallback to this month
        if (customStartDate && customEndDate) {
          startDate = customStartDate
          endDate = customEndDate
        } else {
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
        }
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    return { startDate, endDate }
  }

  const generateChartData = (payments: any[]) => {
    const { startDate, endDate } = getDateRange()
    
    // Filter payments to only include topup payments within the date range
    const topupPayments = payments.filter(p => {
      if (!p.transaction_id.startsWith('TOPUP-')) return false
      const paymentDate = new Date(p.created_at)
      return paymentDate >= startDate && paymentDate <= endDate
    })
    
    // Group payments by date
    const dailySpending: { [key: string]: number } = {}
    
    topupPayments.forEach(payment => {
      const paymentDate = format(parseISO(payment.created_at), 'yyyy-MM-dd')
      if (!dailySpending[paymentDate]) {
        dailySpending[paymentDate] = 0
      }
      dailySpending[paymentDate] += payment.amount
    })

    // Generate all days in the date range
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    
    // Create chart data for all days, with spending data where available
    const chartData = allDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return {
        name: format(date, 'dd'),
        value: dailySpending[dateStr] || 0,
        date: dateStr
      }
    })

    return chartData
  }

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return

      setIsLoadingMetrics(true)

      try {
        const { startDate, endDate } = getDateRange()
        
        const { data: userData } = await supabase
          .from('users')
          .select('id, created_at')
          .eq('email', user.email)
          .single()

        if (userData) {
          // Get ALL payments for this user (no date filter here)
          const { data: allPayments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userData.id)
            .eq('status', 'approved')

          // Get account count for this user
          const { data: adAccounts } = await supabase
            .from('ad_accounts')
            .select('id')
            .eq('user_id', userData.id)

          let totalTransferAmount = 0
          let totalTopupAmount = 0

          if (allPayments) {
            // Filter payments by date range for metrics
            const filteredPayments = allPayments.filter(payment => {
              const paymentDate = new Date(payment.created_at)
              return paymentDate >= startDate && paymentDate <= endDate
            })

            filteredPayments.forEach(payment => {
              if (payment.transaction_id.startsWith('TOPUP-')) {
                totalTopupAmount += payment.amount
              } else {
                totalTransferAmount += payment.amount
              }
            })

            // Generate chart data using all payments
            const chartData = generateChartData(allPayments)
            setSpendChartData(chartData)
          }

          setMetrics({
            totalTransferAmount,
            totalTopupAmount,
            accountCount: adAccounts ? adAccounts.length : 0,
            totalSpending: totalTopupAmount
          })
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setIsLoadingMetrics(false)
      }
    }

    const fetchAdminMetrics = async () => {
      if (!user || !isAdmin) return

      setIsLoadingMetrics(true)

      try {
        const { startDate, endDate } = getDateRange()

        // Get total number of user accounts within date range
        const { data: totalUsers } = await supabase
          .from('users')
          .select('id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        // Get ALL approved payments (no date filter here)
        const { data: allPayments } = await supabase
          .from('payments')
          .select('*')
          .eq('status', 'approved')

        // Get suspended ad accounts
        const { data: suspendedAccounts } = await supabase
          .from('ad_accounts')
          .select('id')
          .eq('status', 'suspended')

        let totalTopupAmount = 0
        let totalSpending = 0
        let totalServiceFees = 0

        if (allPayments) {
          // Filter payments by date range for metrics
          const filteredPayments = allPayments.filter(payment => {
            const paymentDate = new Date(payment.created_at)
            return paymentDate >= startDate && paymentDate <= endDate
          })

          filteredPayments.forEach(payment => {
            if (payment.transaction_id.startsWith('TOPUP-')) {
              totalSpending += payment.amount
            } else {
              totalTopupAmount += payment.amount
            }
            if (payment.fee) {
              totalServiceFees += payment.fee
            }
          })

          // Generate chart data using all payments
          const chartData = generateChartData(allPayments)
          setSpendChartData(chartData)
        }

        setAdminMetrics({
          totalAccounts: totalUsers ? totalUsers.length : 0,
          totalTopupAmount,
          suspendedAccounts: suspendedAccounts ? suspendedAccounts.length : 0,
          totalSpending,
          totalServiceFees
        })
      } catch (error) {
        console.error('Error fetching admin metrics:', error)
      } finally {
        setIsLoadingMetrics(false)
      }
    }

    if (user && !isAdmin) {
      fetchMetrics()
    } else if (user && isAdmin) {
      fetchAdminMetrics()
    }
  }, [user, isAdmin, dateFilter, customStartDate, customEndDate])

  const currentTotalSpending = isAdmin ? adminMetrics.totalSpending : metrics.totalSpending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground">Manage your finances seamlessly across all your entities.</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thismonth">This month</SelectItem>
              <SelectItem value="2months">2 months</SelectItem>
              <SelectItem value="1year">1 year</SelectItem>
              <SelectItem value="custom">Select date</SelectItem>
            </SelectContent>
          </Select>
          
          {dateFilter === "custom" && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[120px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "PP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[120px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "PP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Financial Metrics */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {isLoadingMetrics ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))
          ) : (
            <>
              <MetricCard
                title="Accounts Created"
                value={adminMetrics.totalAccounts.toString()}
                icon={<Users className="h-4 w-4 text-primary" />}
                className="border-l-4 border-l-primary"
              />
              <MetricCard
                title="Total Top-ups (Amount)"
                value={`$${adminMetrics.totalTopupAmount.toFixed(2)}`}
                icon={<CreditCard className="h-4 w-4 text-success" />}
                className="border-l-4 border-l-success"
              />
              <MetricCard
                title="Ended Account Budgets (Suspended)"
                value={adminMetrics.suspendedAccounts.toString()}
                icon={<Shield className="h-4 w-4 text-destructive" />}
                className="border-l-4 border-l-destructive"
              />
              <MetricCard
                title="Total Spending (Amount)"
                value={`$${adminMetrics.totalSpending.toFixed(2)}`}
                icon={<TrendingUp className="h-4 w-4 text-warning" />}
                className="border-l-4 border-l-warning"
              />
              <MetricCard
                title="Service Fee (Profit)"
                value={`$${adminMetrics.totalServiceFees.toFixed(2)}`}
                icon={<DollarSign className="h-4 w-4 text-accent" />}
                className="border-l-4 border-l-accent"
              />
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingMetrics ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))
          ) : (
            <>
              <MetricCard
                title="Total Transfer Amount"
                value={`$${metrics.totalTransferAmount.toFixed(2)}`}
                icon={<DollarSign className="h-4 w-4 text-success" />}
                className="border-l-4 border-l-success"
              />
              <MetricCard
                title="Total Top-up Amount"
                value={`$${metrics.totalTopupAmount.toFixed(2)}`}
                icon={<CreditCard className="h-4 w-4 text-primary" />}
                className="border-l-4 border-l-primary"
              />
              <MetricCard
                title="Ad Accounts"
                value={metrics.accountCount.toString()}
                icon={<Building2 className="h-4 w-4 text-warning" />}
                className="border-l-4 border-l-warning"
              />
              <MetricCard
                title="Total Spending"
                value={`$${metrics.totalSpending.toFixed(2)}`}
                icon={<TrendingUp className="h-4 w-4 text-success" />}
                className="border-l-4 border-l-success"
              />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Spend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Total Spending</CardTitle>
            <div className="text-3xl font-bold">${currentTotalSpending.toFixed(2)}</div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs text-muted-foreground"
                    domain={[0, 1000000]}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
                      return `$${value}`
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={15}
                    minPointSize={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Button variant="ghost" size="sm">See All</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${transaction.bgColor} flex items-center justify-center text-white font-medium`}>
                    {transaction.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.company}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <span className="font-medium text-success">{transaction.amount}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Virtual Accounts</h3>
          </div>
          <p className="text-sm text-muted-foreground">Create distinct money "pools" for better tracking.</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-success" />
            </div>
            <h3 className="font-semibold">Analytics</h3>
          </div>
          <p className="text-sm text-muted-foreground">Get real-time spending insights and financial trends for each of your accounts.</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold">Auto Transfers</h3>
          </div>
          <p className="text-sm text-muted-foreground">Auto top-up when balance is low.</p>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACH Authorizations */}
        <Card>
          <CardHeader>
            <CardTitle>ACH Authorizations</CardTitle>
            <p className="text-sm text-muted-foreground">Set limits on how much vendors can pull from your account and get alerts for unauthorized payments.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">March 1, 2025 <Badge variant="secondary" className="ml-2">INITIATION</Badge></div>
                  <p className="text-xs text-muted-foreground">Gusto is trying to pull $25,000 from your Cash Account</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-destructive/20 rounded-lg">
                <div className="w-2 h-2 bg-destructive rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">March 1, 2025 <Badge variant="destructive" className="ml-2">WARNING</Badge></div>
                  <p className="text-xs text-muted-foreground">ACH flagged - Vendor limit exceeded.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom User Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Custom User Controls</CardTitle>
            <p className="text-sm text-muted-foreground">Set granular permissions, spending limits, and security settings for different users.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{member.category}</p>
                    <Badge variant="secondary" className="text-xs">{member.group}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}