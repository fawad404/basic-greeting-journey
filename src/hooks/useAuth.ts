import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'customer';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth() {
  // TEMPORARY: Mock customer user for development
  const mockUser = {
    id: 'temp-customer-id',
    email: 'customer@test.com',
    created_at: new Date().toISOString(),
  } as User;

  const logout = async () => {
    console.log('Logout bypassed in dev mode');
  };

  return {
    user: mockUser,
    session: { user: mockUser } as Session,
    role: 'customer' as UserRole,
    loading: false,
    logout,
    isAdmin: false,
    isCustomer: true,
  };
}