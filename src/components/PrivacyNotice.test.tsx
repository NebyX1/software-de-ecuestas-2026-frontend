import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SimulationContext } from '../features/simulation/context';
import { PrivacyNotice } from './PrivacyNotice';

describe('response IP notice', () => {
  it('informs real participants that the IP stays with the response and has restricted access', () => {
    render(<PrivacyNotice />);
    expect(screen.getByText(/registramos la dirección IP pública/)).toHaveTextContent('junto con la respuesta');
    expect(screen.getByText(/registramos la dirección IP pública/)).toHaveTextContent('personal autorizado');
  });

  it('keeps the no-storage statement accurate for simulations', () => {
    render(<SimulationContext.Provider value={{ runId: 'local-test', expiresAt: '2099-01-01T00:00:00Z',
      exportCsv: null, completeExport: vi.fn(), download: vi.fn(), restart: vi.fn() }}><PrivacyNotice /></SimulationContext.Provider>);
    expect(screen.getByText('En esta simulación no se guarda la dirección IP ni las respuestas de prueba.')).toBeInTheDocument();
    expect(screen.queryByText(/registramos la dirección IP pública/)).not.toBeInTheDocument();
  });
});
