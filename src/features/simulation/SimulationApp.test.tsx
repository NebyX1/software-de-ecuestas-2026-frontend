import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../lib/axios';
import SimulationApp from './SimulationApp';
import { SIMULATION_SESSION_KEY } from './api';

const originalApiUrl = api.defaults.baseURL;
const active = { status: 'active', runId: 'a'.repeat(43), expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(), username: 'tester' };
const response = (data: unknown): AxiosResponse<unknown> => ({ data, status: 200, statusText: 'OK', headers: {}, config: { headers: new AxiosHeaders() } });
let client: QueryClient;
function mount() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><SimulationApp /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { api.defaults.baseURL = 'https://api.example.test'; });
afterEach(() => { client?.clear(); api.defaults.baseURL = originalApiUrl; });

describe('simulation session resilience', () => {
  it('links administration to the configured backend instead of the static frontend', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(response({ status: 'unauthenticated' }));
    mount();
    expect(await screen.findByRole('link', { name: 'Ir al panel de administración' })).toHaveAttribute('href', 'https://api.example.test/admin/simulation');
  });

  it('preserves the in-memory trial through a status refresh failure and clears it on actual revocation', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(response(active));
    mount();
    await userEvent.click(await screen.findByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Comenzar encuesta' }));
    await userEvent.click(await screen.findByRole('radio', { name: 'Sí' }));
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    const question = '¿Vivís actualmente en el departamento de Lavalleja?';
    expect(await screen.findByText(question)).toBeInTheDocument();

    get.mockRejectedValueOnce(new AxiosError('Offline'));
    await act(async () => { await client.refetchQueries({ queryKey: SIMULATION_SESSION_KEY }); });
    expect(screen.getByText(question)).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos comprobar el acceso de prueba');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar conexión' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByText(question)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(await screen.findByRole('radio', { name: 'Sí' })).toBeChecked();

    await act(async () => { client.setQueryData(SIMULATION_SESSION_KEY, { status: 'disabled' }); });
    expect(await screen.findByText('La simulación está deshabilitada. Habilitala desde el panel de administración.')).toBeInTheDocument();
    await act(async () => { client.setQueryData(SIMULATION_SESSION_KEY, active); });
    expect(await screen.findByRole('button', { name: 'Comenzar encuesta' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
