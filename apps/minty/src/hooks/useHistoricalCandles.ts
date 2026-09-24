import { useCallback, useEffect, useRef, useState } from 'react';
import { HistoricalCandle } from '../types';
import { MarketDataService } from '../services/marketDataService';
import { candlesToCloseSeries } from '../services/marketDataNormalizer';

export type ChartRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX';

export type ChartStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface HistoricalCandlesResult {
  candles: HistoricalCandle[];
  /** Close-price series, ready for the line chart. */
  series: number[];
  status: ChartStatus;
  retry: () => void;
}

/** Ranges the provider understands; the UI offers a few extra labels that map onto these. */
const PROVIDER_RANGE: Record<ChartRange, string> = {
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
  '3M': '3M',
  '6M': '3M',
  '1Y': '1Y',
  '3Y': '5Y',
  '5Y': '5Y',
  MAX: '5Y',
};

/**
 * Loads and validates a historical series for one instrument and range.
 *
 * Handles the full async lifecycle the screens need: loading, success, empty,
 * failure and retry. Results are ignored if the symbol/range changed or the
 * screen unmounted mid-flight, so a slow response can never overwrite a newer
 * one or set state on a dead component.
 */
export function useHistoricalCandles(
  symbol: string | null,
  range: ChartRange
): HistoricalCandlesResult {
  const [candles, setCandles] = useState<HistoricalCandle[]>([]);
  const [series, setSeries] = useState<number[]>([]);
  const [status, setStatus] = useState<ChartStatus>('idle');
  const [attempt, setAttempt] = useState(0);

  // Identifies the in-flight request so stale responses can be discarded.
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!symbol) {
      setStatus('idle');
      setCandles([]);
      setSeries([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    setStatus('loading');

    MarketDataService.getHistoricalCandles(symbol, PROVIDER_RANGE[range] ?? '1D')
      .then((data) => {
        if (cancelled || !mountedRef.current || requestId !== requestIdRef.current) return;
        const validated = Array.isArray(data) ? data : [];
        const closes = candlesToCloseSeries(validated);
        setCandles(validated);
        setSeries(closes);
        // Two points are the minimum that can draw a line.
        setStatus(closes.length >= 2 ? 'ready' : 'empty');
      })
      .catch((err) => {
        if (cancelled || !mountedRef.current || requestId !== requestIdRef.current) return;
        console.warn(`[Minti] historical data failed for ${symbol} ${range}`, err);
        setCandles([]);
        setSeries([]);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, range, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { candles, series, status, retry };
}
