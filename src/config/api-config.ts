export async function apiPost<T = unknown>(
  apiUrl: string,
  apiData?: Record<string, unknown>,
  timeout = 20000
): Promise<{success: boolean; message: string; data: T}> {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
  const path = apiUrl.replace(/^\//, '');
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${base}/${path}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(apiData ?? {}),
      signal: controller.signal
    });
    const body = await res.json().catch(() => null);
    if (!body?.success) {
      throw new Error(body?.message || 'Request failed.');
    }
    return body;
  } finally {
    window.clearTimeout(timer);
  }
}
