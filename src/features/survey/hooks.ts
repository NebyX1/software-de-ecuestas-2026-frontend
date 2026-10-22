import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import api, { asApiError, postCsv, postValidated } from '../../lib/axios';
import { getDeviceId, readAttribution } from './device';
import type { CompleteSurveyAnswers } from './schema';
import { collectClientMetadata } from './metadata';
import { useSimulation } from '../simulation/context';

export const linkSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/), expiresAt: z.string().datetime({ offset: true }) });
const sessionSchema = z.object({ status: z.enum(['active', 'completed']), expiresAt: z.string().datetime({ offset: true }), receiptId: z.string().optional() });
const challengeSchema = z.object({ challengeId: z.string().uuid(), question: z.string().min(1), expiresAt: z.string().datetime({ offset: true }) });
const responseSchema = z.object({ receiptId: z.string().min(1), status: z.literal('completed') });
export const CONSENT_VERSION = '2026-02';

const securitySchema = z.object({ csrf_token: z.string().min(1), turnstileSiteKey: z.string().default('') });
export function useSurveySecurity(enabled: boolean) {
  return useQuery({ queryKey: ['survey-security'], enabled, queryFn: async () => {
    try { return securitySchema.parse((await api.get<unknown>('/api/csrf')).data); }
    catch (error) { throw asApiError(error); }
  } });
}

export function createInvitation(turnstileToken?: string) {
  return postValidated('/api/survey/links', { deviceId: getDeviceId(), ...(turnstileToken ? { turnstileToken } : {}), attribution: readAttribution() }, linkSchema);
}
export function useCreateInvitation() {
  const simulation = useSimulation();
  return useMutation({ mutationFn: (turnstileToken?: string) => simulation
    ? Promise.resolve({ token: simulation.runId, expiresAt: simulation.expiresAt })
    : createInvitation(turnstileToken) });
}
export function useSurveySession(token: string | null) {
  return useQuery({ queryKey: ['survey-session', token], enabled: Boolean(token), queryFn: () => postValidated('/api/survey/session', { token, deviceId: getDeviceId() }, sessionSchema), gcTime: 0 });
}
export function useSurveyChallenge(token: string | null) {
  const simulation = useSimulation();
  return useQuery({
    queryKey: [simulation ? 'simulation-challenge' : 'survey-challenge', token],
    enabled: Boolean(token),
    queryFn: () => simulation
      ? postValidated('/api/simulation/challenge', { runId: simulation.runId }, challengeSchema)
      : postValidated('/api/survey/challenge', { token, deviceId: getDeviceId() }, challengeSchema),
    retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false,
  });
}
export function useSubmitSurvey(token: string | null) {
  const simulation = useSimulation();
  return useMutation({ mutationKey: [simulation ? 'simulation-submit' : 'survey-submit'], ...(simulation ? { gcTime: 0 } : {}), mutationFn: async (input: { phone: string; answers: CompleteSurveyAnswers; challengeId: string; challengeAnswer: string; website: string }) => {
    const clientMetadata = await collectClientMetadata();
    if (simulation) {
      const blob = await postCsv('/api/simulation/export.csv', { ...input, runId: simulation.runId, consent: true, consentVersion: CONSENT_VERSION, clientMetadata });
      simulation.completeExport(blob);
      return { status: 'completed' as const, receiptId: 'SIMULACION' };
    }
    return postValidated('/api/survey/responses', { ...input, token, deviceId: getDeviceId(), consent: true, consentVersion: CONSENT_VERSION, clientMetadata }, responseSchema);
  } });
}
