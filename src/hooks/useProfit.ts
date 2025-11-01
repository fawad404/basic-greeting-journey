import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProfit() {
  const [profit, setProfit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfit = async () => {
      try {
        setIsLoading(true);
        
        // Sum all fees from payments table
        const { data, error } = await supabase
          .from('payments')
          .select('fee')
          .not('fee', 'is', null);

        if (error) {
          console.error('Error fetching profit:', error);
          setProfit(0);
        } else {
          const totalProfit = data?.reduce((sum, payment) => {
            return sum + (payment.fee || 0);
          }, 0) || 0;
          setProfit(totalProfit);
        }
      } catch (error) {
        console.error('Error calculating profit:', error);
        setProfit(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfit();

    // Set up real-time subscription for payments updates
    const channel = supabase
      .channel('profit-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments'
        },
        () => {
          fetchProfit();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { profit, isLoading };
}