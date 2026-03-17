import { supabase, apiBaseUrl } from './supabase';

type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!apiBaseUrl) {
    return { ok: false, status: 0, error: 'api_base_url_missing' };
  }

  const session = (await supabase.auth.getSession()).data.session;
  const headers = new Headers(options.headers ?? {});
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  let data: T | undefined;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = (await response.json()) as T;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data,
      error: (data as { error?: string } | undefined)?.error ?? 'api_error',
    };
  }

  return { ok: true, status: response.status, data };
}
