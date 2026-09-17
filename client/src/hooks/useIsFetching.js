import { useSyncExternalStore } from 'react';
import { getInFlight, subscribeToRequests } from '@/api/client.js';

/**
 * How many API requests are currently in the air.
 *
 * `useSyncExternalStore` rather than a state-and-effect pair: the count lives
 * outside React and changes from an axios interceptor, which is exactly the
 * case this hook exists for. It also keeps the value correct on the very first
 * render, where an effect would report zero for a frame.
 */
export function useIsFetching() {
  return useSyncExternalStore(subscribeToRequests, getInFlight, getInFlight);
}
