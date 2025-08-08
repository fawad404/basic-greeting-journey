import { MetricCard } from "@/components/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, DollarSign, Wallet, CreditCard, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const balanceData = [
  { name: "Fri", value: 1000 },
  { name: "Sat", value: 1050 },
  { name: "Sun", value: 1100 },
  { name: "Mon", value: 1120 },
  { name: "Tue", value: 1135 },
  { name: "Wed", value: 1138 },
  { name: "Thu", value: 1138 },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your account overview.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Current Balance"
          value="$1,138.40"
          change="0%"
          trend="up"
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          className="border-l-4 border-l-primary"
        />
        <MetricCard
          title="Pending Deposits"
          value="$300.00"
          change="100%"
          trend="up"
          icon={<Wallet className="h-4 w-4 text-warning" />}
        />
        <MetricCard
          title="Total Account Balance"
          value="$523.93"
          change="100%"
          trend="up"
          icon={<CreditCard className="h-4 w-4 text-success" />}
        />
        <MetricCard
          title="Total Spend"
          value="$5,778.12"
          change="100%"
          trend="up"
          icon={<DollarSign className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Username:</span>
              <span className="ml-2 font-medium">lixinze</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <span className="ml-2 font-medium">Lixinze50@gmail.com</span>
            </div>
            <div>
              <span className="text-muted-foreground">Account Status:</span>
              <Badge className="ml-2 bg-success text-success-foreground">Active</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Registration Date:</span>
              <span className="ml-2 font-medium">Aug 05, 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Balance Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="w-3 h-3 bg-success rounded-full"></span>
              Current Balance
            </CardTitle>
            <div className="text-2xl font-bold mt-2">$1,138.40</div>
            <p className="text-sm text-muted-foreground">Last 7 days of balance activity</p>
          </div>
          <div className="flex gap-2 text-xs">
            <button className="px-3 py-1 bg-muted rounded-md">7D</button>
            <button className="px-3 py-1 text-muted-foreground hover:bg-muted rounded-md">30D</button>
            <button className="px-3 py-1 text-muted-foreground hover:bg-muted rounded-md">90D</button>
            <button className="px-3 py-1 text-muted-foreground hover:bg-muted rounded-md">1Y</button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1200]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--success))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--success))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}