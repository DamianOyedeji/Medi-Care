// frontend/src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'medi_care_auth_token';
const USER_KEY = 'medi_care_user';

let accessToken: string | null = null;

export function initializeAuth() {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) {
    accessToken = stored;
  }
}

export function setAccessToken(token: string) {
  accessToken = token;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  if (!accessToken) {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      accessToken = stored;
    }
  }
  return accessToken;
}

export function saveUser(user: { id: string; email: string; fullName?: string }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSavedUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const token = getAccessToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearAccessToken();
    }
    throw new Error(data?.message || data?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const api = {
  async get<T>(path: string) {
    return request<T>(path, { method: 'GET' });
  },
  async post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  },
  async patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  },
  async delete<T>(path: string) {
    return request<T>(path, { method: 'DELETE' });
  },
};

initializeAuth();