import React from "react"
import {
  LayoutDashboard, 
  Ticket, 
  Users, 
  CreditCard, 
  LogOut,
  UserCheck,
  FileText,
  Receipt,
  Calendar
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useBalance } from "@/contexts/BalanceContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const baseNavigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tickets", url: "/tickets", icon: Ticket },
]

const customerNavigationItems = [
  { title: "Ad Accounts", url: "/ad-accounts", icon: Users },
]

const userOnlyNavigationItems = [
  { title: "Add Balance", url: "/add-balance", icon: CreditCard },
  { title: "Top-up History", url: "/top-up-history", icon: Calendar },
]

const adminNavigationItems = [
  { title: "Users Management", url: "/users-management", icon: UserCheck },
  { title: "User Accounts", url: "/user-accounts", icon: Users },
  { title: "Top-up Requests", url: "/top-up-requests", icon: FileText },
  { title: "Payments", url: "/payments", icon: Receipt },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location?.pathname || "/"
  const collapsed = state === "collapsed"
  const { user, isAdmin, logout } = useAuth()
  const { balance, isLoading: isLoadingBalance } = useBalance()
  
  const navigationItems = isAdmin
    ? [...baseNavigationItems, ...adminNavigationItems]
    : [...baseNavigationItems, ...customerNavigationItems, ...userOnlyNavigationItems]

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/"
    }
    return currentPath.startsWith(path)
  }

  const getNavClass = (isActiveRoute: boolean) =>
    isActiveRoute 
      ? "bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary" 
      : "hover:bg-sidebar-accent/50 transition-colors"

  return (
    <Sidebar className={`transition-all duration-300 ${collapsed ? "w-16" : "w-64"} border-r border-sidebar-border`}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src="https://res.cloudinary.com/djecn7fxz/image/upload/v1754754707/Gorilla_Ads_2_shmbph.png" alt="Ads Gorilla" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">Ads Gorilla</span>
              <span className="text-xs text-sidebar-foreground/60">Customer Panel</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={getNavClass(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">L</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/60 mt-1">Available Balance</p>
              {isLoadingBalance ? (
                <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
              ) : (
                <p className="text-sm font-semibold text-success">${balance?.toFixed(2) || '0.00'}</p>
              )}
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size={collapsed ? "icon" : "sm"}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </Sidebar>
  )
}