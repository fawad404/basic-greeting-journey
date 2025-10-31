import React, { useState } from "react"
import {
  LayoutDashboard, 
  Ticket, 
  Users, 
  CreditCard, 
  LogOut,
  UserCheck,
  FileText,
  Receipt,
  Calendar,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useBalance } from "@/contexts/BalanceContext"
import { useProfit } from "@/hooks/useProfit"
import { useUserProfile } from "@/hooks/useUserProfile"

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

interface NavigationItem {
  title: string
  url: string
  icon: React.ComponentType<any>
  subItems?: { title: string; url: string }[]
}

const baseNavigationItems: NavigationItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tickets", url: "/tickets", icon: Ticket },
]

const customerNavigationItems: NavigationItem[] = [
  { title: "Ad Accounts", url: "/ad-accounts", icon: Users },
]

const userOnlyNavigationItems: NavigationItem[] = [
  { title: "Add Balance", url: "/add-balance", icon: CreditCard },
  { title: "Top-up History", url: "/top-up-history", icon: Calendar },
]

const adminNavigationItems: NavigationItem[] = [
  { title: "Users Management", url: "/users-management", icon: UserCheck },
  { title: "User Accounts", url: "/user-accounts", icon: Users },
  { 
    title: "Requests", 
    url: "/requests", 
    icon: FileText,
    subItems: [
      { title: "Top-up Requests", url: "/requests/topup" },
      { title: "Replacement", url: "/requests/replacement" },
      { title: "Change Access", url: "/requests/change-access" }
    ]
  },
  { title: "Payments", url: "/payments", icon: Receipt },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location?.pathname || "/"
  const collapsed = state === "collapsed"
  const { user, isAdmin, logout } = useAuth()
  const { balance, isLoading: isLoadingBalance } = useBalance()
  const { profit, isLoading: isLoadingProfit } = useProfit()
  const { profile, isLoading: isLoadingProfile } = useUserProfile(user?.id)
  const [expandedItems, setExpandedItems] = useState<string[]>(['Requests'])
  
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

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  return (
    <Sidebar className={`transition-all duration-300 ${collapsed ? "w-16" : "w-64"} border-r border-sidebar-border`}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className={`flex items-center ${collapsed ? 'w-8 h-8' : 'h-10 w-auto max-w-[140px]'}`}>
            <img 
              src="https://res.cloudinary.com/djecn7fxz/image/upload/v1759388689/Lightning_Ads_Logo_pgrj8o.png" 
              alt="Lightning Ads" 
              className="h-full w-auto object-contain" 
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-sidebar-foreground/60 truncate">
                {isAdmin 
                  ? `Welcome ${profile?.username || 'Admin'}`
                  : `Welcome ${profile?.username || profile?.telegram_username || 'Customer'}`
                }
              </span>
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
                  {item.subItems ? (
                    <>
                      <SidebarMenuButton 
                        onClick={() => toggleExpanded(item.title)}
                        className="h-10 w-full justify-between"
                      >
                        <div className="flex items-center">
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && <span className="ml-3">{item.title}</span>}
                        </div>
                        {!collapsed && (
                          expandedItems.includes(item.title) 
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                        )}
                      </SidebarMenuButton>
                      {!collapsed && expandedItems.includes(item.title) && (
                        <div className="ml-7 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuButton key={subItem.title} asChild className="h-8 text-sm">
                              <NavLink 
                                to={subItem.url}
                                className={getNavClass(isActive(subItem.url))}
                              >
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
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
                  )}
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
              <p className="text-xs text-sidebar-foreground/60 mt-1">
                {isAdmin ? 'Profit' : 'Available Balance'}
              </p>
              {(isAdmin ? isLoadingProfit : isLoadingBalance) ? (
                <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
              ) : (
                <p className="text-sm font-semibold text-success">
                  ${isAdmin ? profit?.toFixed(2) || '0.00' : balance?.toFixed(2) || '0.00'}
                </p>
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