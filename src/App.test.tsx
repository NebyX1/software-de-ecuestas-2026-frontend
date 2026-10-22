import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import api from './lib/axios';
import { useSurveyStore } from './store/surveyStore';
import { validAnswers } from './test/fixtures';

const TOKEN = 'a'.repeat(43);
const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
const response = (data: unknown): AxiosResponse<unknown> => ({ data, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } });
function mount(path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); useSurveyStore.getState().resetAll();
  vi.spyOn(api, 'get').mockResolvedValue(response({ csrf_token: 'csrf-proof' }));
});
describe('public survey flow', () => {
  it('does not issue a link for GET/prefetch and creates one only after consent', async () => {
    const post = vi.spyOn(api, 'post').mockImplementation(async (path) => response(path === '/api/survey/links' ? { token: TOKEN, expiresAt } : { status: 'active', expiresAt }));
    mount();
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Comenzar encuesta' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Comenzar encuesta' }));
    expect(await screen.findByText('¿Tenés 18 años o más?')).toBeInTheDocument();
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
    expect(post.mock.calls.filter((call) => call[0] === '/api/survey/links')).toHaveLength(1);
  });
  it('blocks copied or used links without a restart button', async () => {
    const failed = { ...response({ error: 'Este enlace ya fue utilizado.', code: 'link_used' }), status: 409 };
    vi.spyOn(api, 'post').mockRejectedValue(new AxiosError('Used', 'ERR_BAD_REQUEST', undefined, undefined, failed));
    mount(`/s/${TOKEN}`);
    expect(await screen.findByText('Este enlace no está disponible')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /encuesta|intentar/i })).not.toBeInTheDocument();
    expect(screen.queryByText('¿Tenés 18 años o más?')).not.toBeInTheDocument();
  });
  it('keeps the draft and identical controls when sending fails, then completes after an acknowledged retry', async () => {
    const store = useSurveyStore.getState();
    store.begin(TOKEN, expiresAt); store.updateAnswers(validAnswers()); store.setStep('phone');
    let attempts = 0;
    const challenge = { challengeId: '123e4567-e89b-42d3-a456-426614174000', question: '¿Cuánto es 12 + 34?', expiresAt };
    const post = vi.spyOn(api, 'post').mockImplementation(async (path) => {
      if (path === '/api/survey/session') return response({ status: 'active', expiresAt });
      if (path === '/api/survey/challenge') return response(challenge);
      if (path === '/api/survey/responses') {
        attempts += 1;
        if (attempts === 1) throw new AxiosError('Connection interrupted');
        return response({ status: 'completed', receiptId: 'receipt-confirmed' });
      }
      throw new Error(`Unexpected path ${path}`);
    });
    mount(`/s/${TOKEN}`);
    await userEvent.type(await screen.findByLabelText('Número de celular'), '099123456');
    await userEvent.type(await screen.findByLabelText(challenge.question), '46');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar encuesta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar');
    expect(useSurveyStore.getState().completed).toBe(false);
    expect(useSurveyStore.getState().answers.openComment).toBe(validAnswers().openComment);
    expect(screen.getByLabelText('Número de celular')).toHaveValue('099123456');
    expect(screen.getByLabelText(challenge.question)).toHaveValue('46');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar encuesta' }));
    expect(await screen.findByText('Tu respuesta fue registrada correctamente.')).toBeInTheDocument();
    await waitFor(() => expect(useSurveyStore.getState().receiptId).toBe('receipt-confirmed'));
    const submissions = post.mock.calls.filter((call) => call[0] === '/api/survey/responses');
    expect(submissions).toHaveLength(2);
    expect(submissions[0][1]).toEqual(submissions[1][1]);
    expect(submissions[0][1]).toMatchObject({ phone: '+59899123456', challengeId: challenge.challengeId, challengeAnswer: '46', website: '' });
    expect(submissions[0][1]).toMatchObject({ consentVersion: '2026-02', clientMetadata: { language: navigator.language, viewport: { width: window.innerWidth, height: window.innerHeight } } });
  });
  it.each(['challenge_invalid', 'challenge_expired'])('refreshes %s without losing phone or opinions', async (code) => {
    const store = useSurveyStore.getState();
    store.begin(TOKEN, expiresAt); store.updateAnswers(validAnswers()); store.setStep('phone');
    let challengeCount = 0;
    const post = vi.spyOn(api, 'post').mockImplementation(async (path) => {
      if (path === '/api/survey/session') return response({ status: 'active', expiresAt });
      if (path === '/api/survey/challenge') {
        challengeCount += 1;
        return response({ challengeId: `123e4567-e89b-42d3-a456-42661417400${challengeCount}`, question: challengeCount === 1 ? '¿Cuánto es 12 + 34?' : '¿Cuánto es 3 + 7?', expiresAt });
      }
      if (path === '/api/survey/responses') {
        const failed = { ...response({ error: 'La operación no es válida. Resolvé una nueva.', code }), status: 400 };
        throw new AxiosError('Rejected', 'ERR_BAD_REQUEST', undefined, undefined, failed);
      }
      throw new Error(`Unexpected path ${path}`);
    });
    mount(`/s/${TOKEN}`);
    const phone = await screen.findByLabelText('Número de celular');
    await userEvent.type(phone, '099123456');
    const initialChallenge = await screen.findByLabelText('¿Cuánto es 12 + 34?');
    await userEvent.type(initialChallenge, 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar encuesta' }));
    expect(await screen.findByText('Ingresá el resultado de la operación usando solo números.')).toBeInTheDocument();
    expect(post.mock.calls.some((call) => call[0] === '/api/survey/responses')).toBe(false);
    await userEvent.clear(initialChallenge);
    await userEvent.type(initialChallenge, '45');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar encuesta' }));
    const newChallenge = await screen.findByLabelText('¿Cuánto es 3 + 7?');
    expect(newChallenge).toHaveValue('');
    expect(phone).toHaveValue('099123456');
    expect(useSurveyStore.getState().answers.openComment).toBe(validAnswers().openComment);
    expect(useSurveyStore.getState().completed).toBe(false);
  });
});
