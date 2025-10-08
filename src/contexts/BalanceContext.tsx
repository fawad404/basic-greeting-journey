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
    // TEMPORARY: Return dummy balance for mock customer
    setBalance(5420.50)
    setIsLoading(false)
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