import { ReactNode } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu } from "lucide-react"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
            <SidebarTrigger className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}