import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProfit() {
  const [profit, setProfit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TEMPORARY: Return dummy profit for mock admin
    setProfit(12456.78)
    setIsLoading(false)
  }, []);

  return { profit, isLoading };
}