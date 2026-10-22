import { z } from 'zod';
import { ApiError } from '../../lib/axios';

const DEVICE_KEY = 'encuesta-lavalleja-2026-device-v1';
const uuidSchema = z.string().uuid();

export function getDeviceId(): string {
  try {
    sessionStorage.setItem('encuesta-storage-check', '1');
    sessionStorage.removeItem('encuesta-storage-check');
    const stored = uuidSchema.safeParse(localStorage.getItem(DEVICE_KEY));
    if (stored.success) return stored.data;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    throw new ApiError('Para participar, necesitás habilitar el almacenamiento y las cookies de este sitio y abrirlo mediante una conexión segura.', 'storage_unavailable');
  }
}

export function readAttribution(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = params.get(key);
    if (value) result[key] = value.slice(0, 128);
  }
  return result;
}
