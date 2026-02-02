import { useEffect, useRef, useState } from 'react';

/**
 * Hook để tự động refresh dữ liệu theo thời gian thực
 * @param {Function} fetchFn - Hàm fetch dữ liệu
 * @param {Array} dependencies - Dependencies array
 * @param {number} intervalMs - Khoảng thời gian refresh (ms), mặc định 3000
 * @param {boolean} enabled - Bật/tắt auto-refresh
 * @returns {Object} - { data, isLoading, error, refresh, stop, isRefreshing }
 */
export const useAutoRefresh = (fetchFn, dependencies = [], intervalMs = 3000, enabled = true) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const intervalRef = useRef(null);
  const lastFetchRef = useRef(0);

  // Hàm fetch dữ liệu
  const refresh = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      console.log('🔄 Auto-refreshing data...');
      const result = await fetchFn();
      // Ensure data is never null - use empty array as fallback
      setData(result || []);
      lastFetchRef.current = Date.now();
      console.log('✅ Data refreshed at', new Date().toLocaleTimeString());
    } catch (err) {
      console.error('❌ Refresh error:', err.message);
      setError(err.message);
      // Keep previous data on error, or set to empty array
      setData((prevData) => prevData || []);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Lần đầu tiên load
  useEffect(() => {
    if (!enabled) {
      setData([]);
      return;
    }

    refresh(true); // Show loading on initial load
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...dependencies]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      refresh(false); // Don't show loading on auto-refresh
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMs]);

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏸️ Auto-refresh stopped');
    }
  };

  const start = () => {
    if (!intervalRef.current) {
      refresh(false);
      intervalRef.current = setInterval(() => {
        refresh(false);
      }, intervalMs);
      console.log('▶️ Auto-refresh started');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    stop,
    start,
    lastFetch: lastFetchRef.current
  };
};
