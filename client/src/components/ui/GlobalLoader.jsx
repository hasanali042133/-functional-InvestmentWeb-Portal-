import { useEffect, useState } from 'react';
import { useIsFetching } from '@/hooks/useIsFetching.js';
import { Spinner } from './Spinner.jsx';

// Nothing appears for the first fraction of a second. Most requests answer
// faster than that, and a spinner that flashes up and vanishes reads as a
// glitch rather than as progress — it draws the eye to something that is
// already over.
const APPEAR_AFTER_MS = 400;

// Once it has appeared it stays a moment longer. A badge that leaves the
// instant the response lands can be gone before it was read.
const LINGER_MS = 350;

/**
 * Says that the application is talking to the server, wherever that is
 * happening.
 *
 * Screens cover their own waiting: a skeleton where the table will be, a
 * spinner inside the button that was pressed. What none of them can show is
 * work with no place on the page — a poll refreshing prices in the background,
 * a first request to a server that has gone cold and is taking four seconds to
 * wake up. Without this the window simply sits there, and nothing about it says
 * whether anything is coming.
 *
 * Deliberately small and in the corner. It reports; it does not block, and it
 * never covers what is already on screen.
 */
export function GlobalLoader() {
  const inFlight = useIsFetching();
  const busy = inFlight > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(busy), busy ? APPEAR_AFTER_MS : LINGER_MS);
    return () => clearTimeout(id);
  }, [busy]);

  return (
    <div
      aria-hidden={!visible}
      className={
        'pointer-events-none fixed top-20 right-4 z-50 transition-all duration-200 sm:right-6 ' +
        (visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0')
      }
    >
      <span className="text-brand-700 flex items-center gap-2 rounded-full bg-white/90 py-1.5 pr-3.5 pl-2.5 text-xs font-medium shadow-sm ring-1 ring-slate-200 backdrop-blur">
        <Spinner size="sm" label="Loading" />
        Loading
      </span>
    </div>
  );
}
