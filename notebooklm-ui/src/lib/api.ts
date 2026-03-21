/** Base URL for FastAPI backend (env: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BACKEND_URL). */
export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    'http://localhost:8000'
  );
}
