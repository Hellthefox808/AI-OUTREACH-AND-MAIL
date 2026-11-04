/**
 * Extension auth — pairs with backend OIDC session.
 *
 * Never stores refresh tokens in extension storage.
 */

export interface ExtensionAuthState {
  authenticated: boolean;
  accessToken?: string;
  expiresAt?: number;
}

export const extensionAuth: ExtensionAuthState = {
  authenticated: false,
};

export function setAuth(token: string, expiresInSeconds: number) {
  extensionAuth.authenticated = true;
  extensionAuth.accessToken = token;
  extensionAuth.expiresAt = Date.now() + expiresInSeconds * 1000;
}

export function clearAuth() {
  extensionAuth.authenticated = false;
  extensionAuth.accessToken = undefined;
  extensionAuth.expiresAt = undefined;
}

export function isAuthenticated(): boolean {
  if (!extensionAuth.authenticated || !extensionAuth.expiresAt) {
    return false;
  }
  return Date.now() < extensionAuth.expiresAt;
}
