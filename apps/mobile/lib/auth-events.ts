/**
 * Lightweight event emitter for auth-related events.
 * Used by the API client to signal 401s without depending on React navigation.
 */

type AuthEventListener = () => void;

const listeners = new Set<AuthEventListener>();

export function onUnauthorized(listener: AuthEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitUnauthorized(): void {
  for (const listener of listeners) {
    listener();
  }
}
