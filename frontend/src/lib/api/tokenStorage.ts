/**
 * Centralized token storage abstraction.
 * Provides safe in-browser token storage and change notification.
 */

const TOKEN_KEY = 'campusfind_access_token';

type TokenChangeListener = (token: string | null) => void;
const listeners: Set<TokenChangeListener> = new Set();

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export const tokenStorage = {
  getAccessToken(): string | null {
    try {
      const storage = getStorage();
      return storage ? storage.getItem(TOKEN_KEY) : null;
    } catch {
      return null;
    }
  },

  setAccessToken(token: string): void {
    try {
      const storage = getStorage();
      if (storage) {
        storage.setItem(TOKEN_KEY, token);
      }
      listeners.forEach((listener) => listener(token));
    } catch {
      // Storage unavailable or quota exceeded
    }
  },

  clearAccessToken(): void {
    try {
      const storage = getStorage();
      if (storage) {
        storage.removeItem(TOKEN_KEY);
      }
      listeners.forEach((listener) => listener(null));
    } catch {
      // Storage unavailable
    }
  },

  subscribe(listener: TokenChangeListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
