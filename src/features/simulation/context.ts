import { createContext, useContext } from 'react';

export interface SimulationContextValue {
  runId: string;
  expiresAt: string;
  exportCsv: Blob | null;
  completeExport: (blob: Blob) => void;
  download: () => Promise<void>;
  restart: () => void;
}

export const SimulationContext = createContext<SimulationContextValue | null>(null);
export const useSimulation = () => useContext(SimulationContext);
