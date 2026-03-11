const ACTIVATION_KEY = 'logbook_activated_user';

export interface ActivatedUser {
  id: string;
  displayName: string;
  email: string;
}

export function getActivatedUser(): ActivatedUser | null {
  try {
    const raw = localStorage.getItem(ACTIVATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActivatedUser(user: ActivatedUser) {
  try {
    localStorage.setItem(ACTIVATION_KEY, JSON.stringify(user));
  } catch {}
}

export function clearActivatedUser() {
  localStorage.removeItem(ACTIVATION_KEY);
}
