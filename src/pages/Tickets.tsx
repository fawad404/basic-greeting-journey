import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, MessageCircle } from "lucide-react"

export default function Tickets() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground">Manage your support requests and get help</p>
        </div>
        <Button className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Create New Ticket
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All Tickets
            <Badge variant="secondary" className="text-xs">0</Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="flex items-center gap-2">
            Open
            <Badge variant="secondary" className="text-xs">0</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center gap-2">
            Closed
            <Badge variant="secondary" className="text-xs">0</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Tickets Found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't created any support tickets yet. Click the 'Create New Ticket' button to get started.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Ticket
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Open Tickets</h3>
              <p className="text-muted-foreground text-center max-w-md">
                All your tickets are currently resolved or closed.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Closed Tickets</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You don't have any closed tickets yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}