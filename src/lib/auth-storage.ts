export const MEMBER_TOKEN_KEY = 'kaisa_tool_member_token';
export const ADMIN_TOKEN_KEY = 'kaisa_tool_admin_token';
export const MANAGER_SAVED_ID_KEY = 'kaisa_tool_manager_user_id';
export const MEMBER_SAVED_EMAIL_KEY = 'kaisa_tool_member_email';

export function getSavedManagerId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(MANAGER_SAVED_ID_KEY) || '';
}

export function saveManagerId(userId: string) {
  localStorage.setItem(MANAGER_SAVED_ID_KEY, userId);
}

export function clearSavedManagerId() {
  localStorage.removeItem(MANAGER_SAVED_ID_KEY);
}

export function getSavedMemberEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(MEMBER_SAVED_EMAIL_KEY) || '';
}

export function saveMemberEmail(email: string) {
  localStorage.setItem(MEMBER_SAVED_EMAIL_KEY, email);
}

export function clearSavedMemberEmail() {
  localStorage.removeItem(MEMBER_SAVED_EMAIL_KEY);
}

export function getToken(kind: 'member' | 'admin'): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(kind === 'admin' ? ADMIN_TOKEN_KEY : MEMBER_TOKEN_KEY);
}

export function setToken(kind: 'member' | 'admin', token: string) {
  localStorage.setItem(kind === 'admin' ? ADMIN_TOKEN_KEY : MEMBER_TOKEN_KEY, token);
}

export function clearToken(kind: 'member' | 'admin') {
  localStorage.removeItem(kind === 'admin' ? ADMIN_TOKEN_KEY : MEMBER_TOKEN_KEY);
}
