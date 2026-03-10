const CACHE_KEY = 'logbook_entries_cache';

export function getCachedEntries<T>(): T[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedEntries<T>(entries: T[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full — silently fail
  }
}
