import { useCallback, useEffect, useState } from 'react';

import { getDashboard } from '../api';
import type { SoOrder } from '../types';

export interface SoMonitorData {
  orders: SoOrder[] | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/* The database is only queried when (from, to) change — which happens on the
   Search button / reset / show-all-dates actions — or when refetch() is
   called. Typing into the date inputs never reaches this hook. */
export const useSoMonitorData = (from: string, to: string): SoMonitorData => {
  const [orders, setOrders] = useState<SoOrder[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token: number) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async (): Promise<void> => {
      try {
        const dashboard = await getDashboard({ from, to });
        if (cancelled) return;
        setOrders(dashboard.orders);
        setError(null);
      } catch (reason) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : '');
      }
      if (!cancelled) setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [from, to, reloadToken]);

  return { orders, loading, error, refetch };
};
