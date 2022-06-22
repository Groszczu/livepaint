import { API_HTTP_URL } from './config';

export interface APIResponse<T> {
  data: T;
}

export interface APIError {
  message: string;
}

async function client<T>(
  url: string,
  options?: RequestInit & { data?: any }
): Promise<APIResponse<T>> {
  const response = await fetch(`${API_HTTP_URL}/${url}`, {
    method: 'GET',
    credentials: 'include',
    ...(options?.data
      ? {
          method: 'POST',
          body: JSON.stringify(options.data),
          headers: { 'Content-Type': 'application/json', ...options.headers },
        }
      : {}),
    ...options,
  });
  if (!response.ok) {
    const { message }: APIError = await response.json();
    throw new Error(message);
  }
  if (response.status === 204) {
    return { data: null } as unknown as APIResponse<T>;
  }
  return response.json() as Promise<APIResponse<T>>;
}

export default client;
