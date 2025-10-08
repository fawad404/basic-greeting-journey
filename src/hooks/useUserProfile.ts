import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  username?: string;
  telegram_username?: string;
}

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TEMPORARY: Return dummy profile for mock user
    setProfile({
      username: 'John Doe',
      telegram_username: '@johndoe'
    });
    setIsLoading(false);
  }, [userId]);

  return { profile, isLoading };
}