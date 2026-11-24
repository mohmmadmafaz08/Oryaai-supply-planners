/** Current organization id, shared by the data layer (non-React) and the UI. */
const KEY = 'orbit-org';
let current: string | null = null;

export function getCurrentOrgId(): string | null {
  return current;
}

export function setCurrentOrgId(id: string | null): void {
  current = id;
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    // storage unavailable: org choice just won't persist
  }
}

export function readStoredOrgId(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function requireOrgId(): string {
  if (!current) throw new Error('No organization selected');
  return current;
}
