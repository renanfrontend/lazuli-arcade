import { afterEach, describe, expect, it, vi } from 'vitest';
import { installLoadingRecovery } from '../recoverLoading';
function environment(online = true, controlled = false) {
  const target = new EventTarget(), worker = new EventTarget();
  const reload = vi.fn(), update = vi.fn().mockResolvedValue(undefined);
  const memory = new Map<string, string>();
  vi.stubGlobal('window', { addEventListener: target.addEventListener.bind(target), location: { reload } });
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } });
  vi.stubGlobal('navigator', { onLine: online, serviceWorker: { controller: controlled ? {} : null, addEventListener: worker.addEventListener.bind(worker), getRegistration: vi.fn().mockResolvedValue({ update }) } });
  installLoadingRecovery();
  return { target, worker, reload, update };
}
afterEach(() => { vi.unstubAllGlobals(); });
describe('loading recovery', () => {
  it('reloads a failed dynamic import once and prevents reload loops', () => {
    const { target, reload } = environment();
    const first = new Event('vite:preloadError', {cancelable:true}); target.dispatchEvent(first);
    expect(reload).toHaveBeenCalledTimes(1); expect(first.defaultPrevented).toBe(true);
    const second = new Event('vite:preloadError', {cancelable:true}); target.dispatchEvent(second);
    expect(reload).toHaveBeenCalledTimes(1); expect(second.defaultPrevented).toBe(false);
  });
  it('preserves the error boundary when offline or storage is unavailable', () => {
    const offline = environment(false); offline.target.dispatchEvent(new Event('vite:preloadError')); expect(offline.reload).not.toHaveBeenCalled();
    const privateMode = environment(); vi.stubGlobal('sessionStorage', {getItem: () => {throw new Error('blocked');}});
    privateMode.target.dispatchEvent(new Event('vite:preloadError')); expect(privateMode.reload).not.toHaveBeenCalled();
  });
  it('does not reload on the first worker installation', () => {
    const { worker, reload } = environment(); worker.dispatchEvent(new Event('controllerchange')); expect(reload).not.toHaveBeenCalled();
  });
  it('reloads once when an existing worker is replaced, and checks for updates', async () => {
    const { worker, reload, update } = environment(true, true);
    worker.dispatchEvent(new Event('controllerchange')); worker.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledTimes(1); await Promise.resolve(); expect(update).toHaveBeenCalledOnce();
  });
});
