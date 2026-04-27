import { useEffect, useState } from 'react';
import { subscribe, getOrders, getMasters, getNotifications } from '@/store';

export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  return {
    orders: getOrders(),
    masters: getMasters(),
    notifications: getNotifications(),
  };
}
