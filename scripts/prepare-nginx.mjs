import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { loadEnv } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const value = loadEnv('production', root, 'VITE_').VITE_API_URL?.trim() || 'http://localhost:5000';
const api = new URL(value);
if (!['http:', 'https:'].includes(api.protocol) || api.username || api.password
    || api.search || api.hash || api.pathname !== '/') {
  throw new Error('VITE_API_URL debe ser el origen del backend, por ejemplo https://mapi.uypolls.online');
}
const template = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8');
writeFileSync(new URL('../nginx.generated.conf', import.meta.url), template.replaceAll('__API_ORIGIN__', api.origin));
