import React, { useState, useEffect } from "react"
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
import { supabase } from "@/integrations/supabase/client"

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
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!user) return
      
      setIsLoadingBalance(true)

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()

        if (userData) {
          // Fetch payments and calculate balance as (amount - fee - topup) for approved payments
          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userData.id)
            .eq('status', 'approved')

          if (payments) {
            const calculatedBalance = payments.reduce((sum, payment) => {
              const fee = payment.fee || 0
              if (payment.transaction_id.startsWith('TOPUP-')) {
                // For approved top-ups, add back the amount minus fee
                return sum + (payment.amount - fee)
              } else {
                // For crypto deposits, add to balance minus fee
                return sum + (payment.amount - fee)
              }
            }, 0)
            
            // Also subtract pending top-ups from balance
            const { data: pendingTopups } = await supabase
              .from('payments')
              .select('amount')
              .eq('user_id', userData.id)
              .eq('status', 'pending')
              .like('transaction_id', 'TOPUP-%')
            
            const pendingDeductions = (pendingTopups || []).reduce((sum, topup) => sum + topup.amount, 0)
            setUserBalance(calculatedBalance - pendingDeductions)
          }
        }
      } catch (error) {
        console.error('Error fetching user balance:', error)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    if (user) {
      fetchUserBalance()
    }
  }, [user])
  
  const navigationItems = isAdmin 
    ? [...baseNavigationItems, ...adminNavigationItems]
    : [...baseNavigationItems, ...userOnlyNavigationItems]

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
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
            GA
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">GoAds</span>
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
                <p className="text-sm font-semibold text-success">${userBalance?.toFixed(2) || '0.00'}</p>
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