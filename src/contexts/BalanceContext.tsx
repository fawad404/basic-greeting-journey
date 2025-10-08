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
        // Fetch all payments and calculate balance
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userData.id)

        let calculatedBalance = 0
        if (payments) {
          // Add crypto deposits (admin-entered top-up amounts)
          const cryptoDeposits = payments.filter(p => 
            !p.transaction_id.startsWith('TOPUP-') && p.status === 'approved'
          )
          const cryptoBalance = cryptoDeposits.reduce((sum, payment) => {
            // For crypto deposits, amount is the admin-entered "Total Top-up Amount"
            return sum + payment.amount
          }, 0)
          
          // Subtract ALL top-ups (both pending and approved) - they are money SPENT from balance
          const allTopUps = payments.filter(p => 
            p.transaction_id.startsWith('TOPUP-') && (p.status === 'pending' || p.status === 'approved')
          )
          const spentAmount = allTopUps.reduce((sum, payment) => sum + payment.amount, 0)
          
          // Balance = crypto deposits - all top-ups (spent money)
          calculatedBalance = cryptoBalance - spentAmount
        }
        
        setBalance(calculatedBalance)
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