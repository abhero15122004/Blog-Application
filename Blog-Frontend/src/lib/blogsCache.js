const CACHE_KEY = "aiden:blogs:list";
const CACHE_VERSION = 1;
const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

const safeStorage = () => {
  try {
    if (typeof window === "undefined") return null;
    const k = "__aiden_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readCache = () => {
  const store = safeStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CACHE_VERSION || !Array.isArray(parsed.data)) {
      return null;
    }
    return { data: parsed.data, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
};

export const writeCache = (data) => {
  const store = safeStorage();
  if (!store || !Array.isArray(data)) return;
  try {
    store.setItem(
      CACHE_KEY,
      JSON.stringify({
        version: CACHE_VERSION,
        savedAt: Date.now(),
        data,
      })
    );
  } catch {
    /* quota or serialization issues — silently skip */
  }
};

export const clearCache = () => {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
};

export const isCacheStale = (savedAt) => {
  if (!savedAt) return true;
  return Date.now() - savedAt > STALE_AFTER_MS;
};
