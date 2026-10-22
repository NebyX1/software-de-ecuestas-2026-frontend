import axios from 'axios';
import { z } from 'zod';

// Keep browser requests same-origin. Nginx/Vite forwards /api to Flask.
const api = axios.create({ baseURL: '/', withCredentials: true, timeout: 20_000, headers: { Accept: 'application/json' } });
const csrfSchema = z.object({ csrf_token: z.string().min(1) });
const errorSchema = z.object({ error: z.string(), code: z.string().optional() });

export class ApiError extends Error {
  constructor(message: string, public readonly code: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function asApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const data = errorSchema.safeParse(error.response?.data);
    if (data.success) return new ApiError(data.data.error, data.data.code ?? 'request_failed', error.response?.status);
    if (error.response?.status === 429) return new ApiError('Se realizaron demasiados intentos. Esperá unos minutos antes de volver a intentar.', 'rate_limited', 429);
    if (error.response?.status === 400) return new ApiError('Tu sesión de seguridad venció. Volvé a intentar.', 'request_failed', 400);
    return new ApiError('No pudimos conectar con el servicio. Tus respuestas se conservan en esta pestaña; volvé a intentar.', 'network_error', error.response?.status);
  }
  return new ApiError('El servicio devolvió una respuesta inesperada. Volvé a intentar en unos minutos.', 'invalid_response');
}

export async function postValidated<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  try {
    const csrf = csrfSchema.parse((await api.get<unknown>('/api/csrf')).data);
    const response = await api.post<unknown>(path, body, { headers: { 'X-CSRFToken': csrf.csrf_token } });
    return schema.parse(response.data);
  } catch (error) {
    throw asApiError(error);
  }
}

export async function postCsv(path: string, body: unknown): Promise<Blob> {
  try {
    const csrf = csrfSchema.parse((await api.get<unknown>('/api/csrf')).data);
    const response = await api.post<Blob>(path, body, { responseType: 'blob', headers: { 'X-CSRFToken': csrf.csrf_token } });
    if (!String(response.headers['content-type']).startsWith('text/csv')) throw new ApiError('El servicio no devolvió un CSV válido.', 'invalid_response');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()) as unknown; } catch { /* Keep the original network error. */ }
    }
    throw asApiError(error);
  }
}

export default api;
