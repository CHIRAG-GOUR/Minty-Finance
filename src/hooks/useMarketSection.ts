import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionResult } from '../services/marketSections';

export interface MarketSectionState<T> {
  /** 'loading' only on the first load; a refresh keeps the previous rows visible. */
  phase: 'loading' | 'ok' | 'empty' | 'unavailable' | 'error';
  data: T[];
  reason?: string;
  asOf: number | null;
  retry: () => void;
}

/**
 * Loads one Markets section in isolation.
 *
 * Each section owns its own state, so one failing feed shows a retry inside
 * that panel while every other section stays usable. Stale responses are
 * discarded and nothing is set after unmount.
 */
export function useMarketSection<T>(
  loader: () => Promise<SectionResult<T>>,
  deps: readonly unknown[],
  /** Bumped by the screen's pull-to-refresh. */
  refreshKey: number = 0
): MarketSectionState<T> {
  const [phase, setPhase] = useState<MarketSectionState<T>['phase']>('loading');
  const [data, setData] = useState<T[]>([]);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [asOf, setAsOf] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  const mountedRef = useRef(true);
  const requestRef = useRef(0);
  // Kept in a ref so an inline arrow loader does not restart the effect forever.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const id = ++requestRef.current;
    let cancelled = false;

    // Only blank the panel when there is nothing to keep showing.
    setPhase((prev) => (prev === 'ok' ? prev : 'loading'));

    loaderRef
      .current()
      .then((result) => {
        if (cancelled || !mountedRef.current || id !== requestRef.current) return;
        setAsOf(result.asOf);
        setReason(result.reason);
        if (result.status === 'unavailable') {
          setData([]);
          setPhase('unavailable');
        } else if (result.status === 'error') {
          setData([]);
          setPhase('error');
        } else {
          setData(result.data);
          setPhase(result.data.length === 0 ? 'empty' : 'ok');
        }
      })
      .catch(() => {
        if (cancelled || !mountedRef.current || id !== requestRef.current) return;
        setData([]);
        setReason('Unable to load this section.');
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { phase, data, reason, asOf, retry };
}
