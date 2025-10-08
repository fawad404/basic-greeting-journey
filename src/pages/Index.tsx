import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/metric-card"
import { DollarSign, Users, ShoppingCart, TrendingUp } from "lucide-react"

const Index = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="$45,231.89"
          change="+20.1% from last month"
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Active Users"
          value="2,350"
          change="+180.1% from last month"
          trend="up"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Ad Accounts"
          value="12,234"
          change="+19% from last month"
          trend="up"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Profit"
          value="$12,456.78"
          change="+8% from last month"
          trend="up"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">user{i}@example.com</p>
                    <p className="text-xs text-muted-foreground">${(Math.random() * 1000).toFixed(2)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Top-up', 'Replacement', 'Change Access', 'Support', 'Account'].map((type, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{type} Request</p>
                    <p className="text-xs text-muted-foreground">user{i + 1}@example.com</p>
                  </div>
                  <span className="text-xs text-warning">Pending</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
