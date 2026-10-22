import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import api, { postValidated } from './axios';

const response = (data: unknown): AxiosResponse<unknown> => ({ data, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } });
beforeEach(() => { vi.spyOn(api, 'get').mockResolvedValue(response({ csrf_token: 'csrf-proof' })); });
describe('API security and failures', () => {
  it('sends CSRF and validates the runtime response', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(response({ status: 'active' }));
    await expect(postValidated('/api/example', { input: 1 }, z.object({ status: z.literal('active') }))).resolves.toEqual({ status: 'active' });
    expect(post).toHaveBeenCalledWith('/api/example', { input: 1 }, { headers: { 'X-CSRFToken': 'csrf-proof' } });
  });
  it('does not accept malformed success responses', async () => {
    vi.spyOn(api, 'post').mockResolvedValue(response({ status: 'pending' }));
    await expect(postValidated('/api/example', {}, z.object({ status: z.literal('active') }))).rejects.toMatchObject({ code: 'invalid_response' });
  });
  it('preserves machine codes for used links', async () => {
    const failed = { ...response({ error: 'Este enlace ya fue utilizado.', code: 'link_used' }), status: 409 };
    vi.spyOn(api, 'post').mockRejectedValue(new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, failed));
    await expect(postValidated('/api/example', {}, z.object({}))).rejects.toMatchObject({ code: 'link_used', status: 409, message: 'Este enlace ya fue utilizado.' });
  });
  it('does not send a mutation when CSRF cannot be obtained', async () => {
    vi.mocked(api.get).mockRejectedValue(new AxiosError('Network failed'));
    const post = vi.spyOn(api, 'post');
    await expect(postValidated('/api/example', {}, z.object({}))).rejects.toMatchObject({ code: 'network_error' });
    expect(post).not.toHaveBeenCalled();
  });
});
