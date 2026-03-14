const CACHE_KEY = 'logbook_entries_cache';
const QUEUE_KEY = 'logbook_offline_queue';
const OFFLINE_USER_KEY = 'logbook_offline_user';

// --- Entry cache ---

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

// --- Offline user memory (remember last logged-in user for offline bypass) ---

export function setOfflineUser(user: { id: string; email: string; offlineApproved?: boolean }) {
  try {
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getOfflineUser(): { id: string; email: string; offlineApproved?: boolean } | null {
  try {
    const raw = localStorage.getItem(OFFLINE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// --- Offline mutation queue ---

export type OfflineAction =
  | { type: 'add'; tempId: string; entry: Record<string, any> }
  | { type: 'update'; id: string; entry: Record<string, any> }
  | { type: 'delete'; id: string };

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setOfflineQueue(actions: OfflineAction[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(actions));
  } catch {}
}

export function pushOfflineAction(action: OfflineAction) {
  try {
    const queue = getOfflineQueue();
    queue.push(action);
    setOfflineQueue(queue);
  } catch {}
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}
