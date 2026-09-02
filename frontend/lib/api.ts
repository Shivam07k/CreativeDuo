const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      body?.error || body?.message || res.statusText,
      res.status,
      body,
    );
  }

  return body as T;
}

export async function fetchAPI<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function postAPI<T>(
  path: string,
  body: any,
  token?: string,
): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function putAPI<T>(
  path: string,
  body: any,
  token?: string,
): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function deleteAPI<T>(
  path: string,
  token?: string,
): Promise<T> {
  return request<T>(path, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function uploadFile(
  path: string,
  file: File,
  folder: string,
  token: string,
): Promise<{ url: string }> {
  const url = `${BASE_URL}${path}`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      body?.error || body?.message || res.statusText,
      res.status,
      body,
    );
  }

  return body as { url: string };
}
