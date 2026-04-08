const ADMIN_KEY = "nexapex_admin";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_KEY);
}
