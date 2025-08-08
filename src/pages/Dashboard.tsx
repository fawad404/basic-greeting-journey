import { MetricCard } from "@/components/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, DollarSign, Wallet, CreditCard, TrendingUp, ArrowUpRight, Users, BarChart3, Shield, Zap, ArrowRightLeft, Building2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"

const spendData = [
  { name: "Mon", value: 8500 },
  { name: "Tue", value: 7200 },
  { name: "Wed", value: 6800 },
  { name: "Thu", value: 9100 },
  { name: "Fri", value: 8900 },
  { name: "Sat", value: 7600 },
  { name: "Sun", value: 8200 },
]

const transactions = [
  { company: "Meta Platforms Inc.", date: "26 February", amount: "+$815.60", avatar: "M", bgColor: "bg-blue-500" },
  { company: "Stripe Inc.", date: "24 February", amount: "+$782", avatar: "S", bgColor: "bg-purple-500" },
  { company: "CJ Affiliate LLC", date: "24 February", amount: "+$460.75", avatar: "C", bgColor: "bg-teal-500" },
  { company: "Google Ads", date: "23 February", amount: "+$923.40", avatar: "G", bgColor: "bg-orange-500" },
]

const teamMembers = [
  { name: "Bobbie Nader", role: "Admin, cardholder", category: "Office supplies", group: "Product Launch", avatar: "BN" },
  { name: "Emily Johnson", role: "Cardholder, accountant", category: "Marketing", group: "R&D Funding", avatar: "EJ" },
  { name: "Michael Brown", role: "Admin, accountant", category: "Travel", group: "Sales Team", avatar: "MB" },
  { name: "Sophia Lee", role: "Admin, accountant", category: "Stack, Linear", group: "Product Launch", avatar: "SL" },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
        <p className="text-muted-foreground">Manage your finances seamlessly across all your entities.</p>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Income"
          value="$128,504.67"
          icon={<DollarSign className="h-4 w-4 text-success" />}
          className="border-l-4 border-l-success"
        />
        <MetricCard
          title="Owner's Compensation"
          value="$34,547.29"
          icon={<Users className="h-4 w-4 text-primary" />}
          className="border-l-4 border-l-primary"
        />
        <MetricCard
          title="Operating Expenses"
          value="$1,694,238.43"
          icon={<BarChart3 className="h-4 w-4 text-warning" />}
          className="border-l-4 border-l-warning"
        />
        <MetricCard
          title="Profit"
          value="$34,547.29"
          icon={<TrendingUp className="h-4 w-4 text-success" />}
          className="border-l-4 border-l-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Spend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Total spend</CardTitle>
            <div className="text-3xl font-bold">$68,026.43</div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Payment methods</span>
              <span>Card merchants</span>
              <span>Contacts</span>
              <span>Card groups</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendData}>
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
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
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
                  <p className="text-sm font-medium">March 1, 2025 <Badge variant="secondary" className="ml-2">INITIATION</Badge></p>
                  <p className="text-xs text-muted-foreground">Gusto is trying to pull $25,000 from your Cash Account</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-destructive/20 rounded-lg">
                <div className="w-2 h-2 bg-destructive rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">March 1, 2025 <Badge variant="destructive" className="ml-2">WARNING</Badge></p>
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