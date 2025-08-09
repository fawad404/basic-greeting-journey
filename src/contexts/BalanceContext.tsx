import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

interface BalanceContextType {
  balance: number | null
  isLoading: boolean
  refreshBalance: () => Promise<void>
  updateBalanceAfterTopUp: (amount: number) => void
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined)

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserBalance = useCallback(async () => {
    if (!user) {
      setBalance(null)
      setIsLoading(false)
      return
    }
      
    setIsLoading(true)

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userData) {
        // Fetch approved payments and calculate balance
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userData.id)
          .eq('status', 'approved')

        let calculatedBalance = 0
        if (payments) {
          calculatedBalance = payments.reduce((sum, payment) => {
            const fee = payment.fee || 0
            if (payment.transaction_id.startsWith('TOPUP-')) {
              // For approved top-ups, this is money going OUT - don't add to balance
              return sum
            } else {
              // For crypto deposits, add to balance minus fee
              return sum + (payment.amount - fee)
            }
          }, 0)
        }
        
        // Subtract pending top-ups from balance
        const { data: pendingTopups } = await supabase
          .from('payments')
          .select('amount')
          .eq('user_id', userData.id)
          .eq('status', 'pending')
          .like('transaction_id', 'TOPUP-%')
        
        const pendingDeductions = (pendingTopups || []).reduce((sum, topup) => sum + topup.amount, 0)
        setBalance(calculatedBalance - pendingDeductions)
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
      setBalance(0)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const updateBalanceAfterTopUp = (amount: number) => {
    if (balance !== null) {
      setBalance(prev => (prev || 0) - amount)
    }
  }

  useEffect(() => {
    fetchUserBalance()
  }, [fetchUserBalance])

  const refreshBalance = useCallback(async () => {
    await fetchUserBalance()
  }, [fetchUserBalance])

  return (
    <BalanceContext.Provider value={{
      balance,
      isLoading,
      refreshBalance,
      updateBalanceAfterTopUp
    }}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalance() {
  const context = useContext(BalanceContext)
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider')
  }
  return context
}