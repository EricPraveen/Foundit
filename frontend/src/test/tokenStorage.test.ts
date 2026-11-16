import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tokenStorage } from '@/lib/api/tokenStorage';

describe('tokenStorage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves access token', () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
    tokenStorage.setAccessToken('sample.jwt.token');
    expect(tokenStorage.getAccessToken()).toBe('sample.jwt.token');
  });

  it('clears access token on request', () => {
    tokenStorage.setAccessToken('sample.jwt.token');
    expect(tokenStorage.getAccessToken()).toBe('sample.jwt.token');
    tokenStorage.clearAccessToken();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('notifies subscribers when token changes', () => {
    const listener = vi.fn();
    const unsubscribe = tokenStorage.subscribe(listener);

    tokenStorage.setAccessToken('token-1');
    expect(listener).toHaveBeenCalledWith('token-1');

    tokenStorage.clearAccessToken();
    expect(listener).toHaveBeenCalledWith(null);

    unsubscribe();
    tokenStorage.setAccessToken('token-2');
    expect(listener).toHaveBeenCalledTimes(2); // no third call
  });
});
