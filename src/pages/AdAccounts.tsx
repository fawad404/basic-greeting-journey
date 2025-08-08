import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, Calendar, Globe, DollarSign, MapPin, Clock } from "lucide-react"

const mockAccounts = [
  {
    id: "106-201-1997",
    name: "BR06 - Burner - 1945 - Lxxx",
    status: "Active",
    budget: 500.00,
    dailyBudget: 0.00,
    totalSpent: 0.00,
    created: "Aug 6",
    country: "N/A",
    timezone: "UTC",
    currency: "USD"
  },
  {
    id: "927-924-4974",
    name: "BR06 - Burner - 1944 - Lxxx",
    status: "Suspended",
    budget: 0.00,
    dailyBudget: 0.00,
    totalSpent: 0.00,
    created: "Aug 6",
    country: "N/A",
    timezone: "UTC",
    currency: "USD"
  },
  {
    id: "762-418-5586",
    name: "BR06 - Burner - 1941 - Lxxx",
    status: "Suspended",
    budget: 23.93,
    dailyBudget: 0.00,
    totalSpent: 0.00,
    created: "Aug 5",
    country: "N/A",
    timezone: "UTC",
    currency: "USD"
  },
  {
    id: "481-362-0082",
    name: "BR06 - Burner - 1943 - Lxxx",
    status: "Suspended",
    budget: 0.00,
    dailyBudget: 0.00,
    totalSpent: 0.00,
    created: "Aug 5",
    country: "N/A",
    timezone: "UTC",
    currency: "USD"
  },
  {
    id: "492-341-0205",
    name: "BR06 - Burner - 1942 - Lxxx",
    status: "Suspended",
    budget: 0.00,
    dailyBudget: 0.00,
    totalSpent: 0.00,
    created: "Aug 5",
    country: "N/A",
    timezone: "UTC",
    currency: "USD"
  }
]

export default function AdAccounts() {
  const [selectedAccount, setSelectedAccount] = useState(mockAccounts[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [topUpAmount, setTopUpAmount] = useState("")
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  const { toast } = useToast()

  const filteredAccounts = mockAccounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.id.includes(searchTerm)
  )

  const handleTopUpSubmit = () => {
    if (topUpAmount && parseFloat(topUpAmount) > 0) {
      setIsTopUpOpen(false)
      setTopUpAmount("")
      toast({
        title: "Top-up successfully!",
        description: "You will be notified after approval.",
      })
    }
  }

  const isTopUpDisabled = !topUpAmount || parseFloat(topUpAmount) <= 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Accounts List */}
        <div className="lg:w-96">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Ad Accounts</h2>
              <Badge variant="secondary">{filteredAccounts.length}</Badge>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredAccounts.map((account) => (
              <Card
                key={account.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedAccount.id === account.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedAccount(account)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm truncate">{account.name}</h3>
                    <Badge 
                      variant={account.status === "Active" ? "default" : "secondary"}
                      className={account.status === "Active" ? "bg-success text-success-foreground" : ""}
                    >
                      {account.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{account.id}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      ${account.budget.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {account.created}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Account Details */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{selectedAccount.name}</h1>
              <p className="text-muted-foreground">Account ID: {selectedAccount.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Information */}
            <Card className="lg:col-span-2">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-6 bg-muted/20">
                  <div className="space-y-3 text-left">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Creation Date:</span>
                      <span className="ml-2 font-medium">2025.08.08</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Total Topup Amount:</span>
                      <span className="ml-2 font-medium">$660</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Access Email:</span>
                      <span className="ml-2 font-medium">test@gmail.com</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" className="flex-1 sm:flex-none sm:min-w-32">
                        Top-Up
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold">Top-Up Account</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="text-center"
                        />
                        <Button 
                          onClick={handleTopUpSubmit}
                          disabled={isTopUpDisabled}
                          className="w-full"
                        >
                          Send
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="flex-1 sm:flex-none sm:min-w-32">
                    Replace
                  </Button>
                  <Button variant="outline" className="flex-1 sm:flex-none sm:min-w-32">
                    Change Access
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Location & Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Globe className="h-4 w-4" />
                  Location & Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Country</span>
                    <p className="font-medium mt-1">{selectedAccount.country}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timezone</span>
                    <p className="font-medium mt-1">{selectedAccount.timezone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Currency</span>
                    <p className="font-medium mt-1">{selectedAccount.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Clock className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created Date</span>
                    <p className="font-medium mt-1">August 6, 2025</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated</span>
                    <p className="font-medium mt-1">August 6, 2025</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}