/** A tab left open across deployments can request chunks from the previous build. */
export function installLoadingRecovery(): void {
  const key = 'lazuli:chunk-reload';
  window.addEventListener('vite:preloadError', (event) => {
    if (!navigator.onLine) return;
    try {
      const last = Number(sessionStorage.getItem(key));
      if (Date.now() - last < 60_000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // Without a reload guard, let the error boundary offer a manual retry.
      return;
    }
    event.preventDefault();
    window.location.reload();
  });
  if ('serviceWorker' in navigator) {
    // Do not reload on the first installation, only when an existing worker is replaced.
    const hadController = navigator.serviceWorker.controller !== null;
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || refreshed) return;
      refreshed = true;
      window.location.reload();
    });
    void navigator.serviceWorker.getRegistration().then((registration) => registration?.update()).catch(() => undefined);
  }
}
