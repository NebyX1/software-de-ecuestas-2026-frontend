import { z } from 'zod';
import api, { asApiError } from '../../lib/axios';

export const simulationStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('active'), runId: z.string().regex(/^[A-Za-z0-9_-]{43}$/), expiresAt: z.string().datetime({ offset: true }), username: z.string() }),
  z.object({ status: z.literal('unauthenticated'), message: z.string().optional() }),
  z.object({ status: z.literal('disabled'), message: z.string().optional() }),
]);
export type SimulationStatus = z.infer<typeof simulationStatusSchema>;
export type ActiveSimulation = Extract<SimulationStatus, { status: 'active' }>;
export const SIMULATION_SESSION_KEY = ['simulation-session'] as const;

export async function getSimulationStatus(): Promise<SimulationStatus> {
  try { return simulationStatusSchema.parse((await api.get<unknown>('/api/simulation/session')).data); }
  catch (error) { throw asApiError(error); }
}
