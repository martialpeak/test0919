// Central API fetch helper: prefixes the API base (window.MOVIEBROWSER_API_BASE)
// so the same build works on the VPS (same-origin '') and on InfinityFree
// (front controller /api/index.php). All /api/... calls must go through this.
export const API_BASE: string = typeof window !== 'undefined' ? ((window as any).MOVIEBROWSER_API_BASE ?? '') : '';

export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, options);
}
