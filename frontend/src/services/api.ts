const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    const message =
      typeof body.error === 'string' ? body.error : JSON.stringify(body.error ?? body);
    throw new ApiError(response.status, body, message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Generic methods
  get: <T>(endpoint: string): Promise<T> =>
    fetch(`${API_BASE}${endpoint}`).then(handleResponse<T>),

  post: <T>(endpoint: string, data: unknown): Promise<T> =>
    fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<T>),

  put: <T>(endpoint: string, data: unknown): Promise<T> =>
    fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<T>),

  delete: <T>(endpoint: string): Promise<T> =>
    fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
    }).then(handleResponse<T>),
};
