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
  // TEMPORARY: Mock admin user for development
  const mockUser = {
    id: 'temp-admin-id',
    email: 'admin@temp.com',
    created_at: new Date().toISOString(),
  } as User;

  const logout = async () => {
    console.log('Logout bypassed in dev mode');
  };

  return {
    user: mockUser,
    session: { user: mockUser } as Session,
    role: 'admin' as UserRole,
    loading: false,
    logout,
    isAdmin: true,
    isCustomer: false,
  };
}