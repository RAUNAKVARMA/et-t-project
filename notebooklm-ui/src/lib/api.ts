/**
 * Base path/URL for the FastAPI backend.
 * - Default: same-origin proxy `/api/rag` (see next.config.ts rewrites → http://127.0.0.1:8000).
 * - Override with NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BACKEND_URL for production or direct calls.
 */
export function getApiBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return '/api/rag';
}

/** Readable message from a failed FastAPI / Next proxy response. */
export async function parseApiErrorResponse(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) {
    return `Request failed (${res.status} ${res.statusText}). Is the API running on port 8000?`;
  }
  try {
    const j = JSON.parse(text) as { detail?: unknown; message?: string };
    if (j.detail !== undefined) {
      const d = j.detail;
      if (Array.isArray(d)) {
        return d
          .map((item: unknown) => {
            if (item && typeof item === 'object' && 'msg' in item) {
              return String((item as { msg: string }).msg);
            }
            return JSON.stringify(item);
          })
          .join(' ');
      }
      return String(d);
    }
    if (j.message) return String(j.message);
  } catch {
    /* not JSON — often HTML from 502 when backend is down */
  }
  const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (snippet.startsWith('<!') || snippet.includes('<html')) {
    return `Cannot reach API (${res.status}). Start the backend: npm run dev:api`;
  }
  return snippet || `Request failed (${res.status}).`;
}
