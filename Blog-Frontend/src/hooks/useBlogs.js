import { useCallback, useEffect, useRef, useState } from "react";
import apiFetch from "../components/utils/api";
import { readCache, writeCache, isCacheStale } from "../lib/blogsCache";

/**
 * useBlogs — resilient fetch for /api/blogs.
 *
 * Strategy:
 *   1. Show cached data immediately (if any) so the page is never empty.
 *   2. Fetch fresh data in the background. Retry once on 5xx after 1.5s.
 *   3. On success, replace cache + clear staleness.
 *   4. On final failure, keep the cached data and mark it stale.
 *
 * Returns: { blogs, loading, error, isStale, savedAt, refetch }
 */
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1500;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const useBlogs = () => {
  const initialCache = readCache();

  const [blogs, setBlogs] = useState(initialCache?.data || []);
  const [savedAt, setSavedAt] = useState(initialCache?.savedAt || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stale, setStale] = useState(
    initialCache ? isCacheStale(initialCache.savedAt) : false
  );

  // Track whether we still have a previously-shown dataset (from cache)
  const hasShownDataRef = useRef(Boolean(initialCache?.data?.length));
  const mountedRef = useRef(true);

  const doFetch = useCallback(async (attempt = 0) => {
    const response = await apiFetch("/api/blogs", { method: "GET" });
    if (!response.ok) {
      // Retry on 5xx
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY_MS);
        return doFetch(attempt + 1);
      }
      const err = new Error(`Server responded ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return response.json();
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await doFetch();
      if (!mountedRef.current) return;
      setBlogs(data);
      writeCache(data);
      setSavedAt(Date.now());
      setStale(false);
      hasShownDataRef.current = data.length > 0;
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("useBlogs: fetch failed", err);
      setError(err);
      // If we have cached data, keep showing it — just mark as stale.
      if (hasShownDataRef.current) {
        setStale(true);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [doFetch]);

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => {
      mountedRef.current = false;
    };
  }, [refetch]);

  return {
    blogs,
    loading,
    error,
    isStale: stale,
    savedAt,
    refetch,
    hasCachedFallback: hasShownDataRef.current,
  };
};

export default useBlogs;
