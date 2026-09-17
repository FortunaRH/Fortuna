// Lightweight module store for the full-screen navigation loading overlay.
// Landing3D calls startLoading() on a CRT click; LoadingOverlay subscribes and
// clears the store once the destination route has actually mounted.

type Listener = () => void;

let destination: string | null = null;
const listeners = new Set<Listener>();

export function startLoading(dest: string): void {
  destination = dest;
  emit();
}

export function finishLoading(): void {
  destination = null;
  emit();
}

export function getDestination(): string | null {
  return destination;
}

export function subscribeLoading(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}
