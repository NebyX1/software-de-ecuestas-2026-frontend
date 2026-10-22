import { createContext, useContext } from 'react';
import { create, createStore, useStore, type StateCreator, type StoreApi } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import type { SurveyAnswers, SurveyState } from '../types';
import { draftAnswersSchema } from '../schemas/surveySchemas';
import { reachableStep } from '../utils/surveyFlow';
import { resolveMunicipality } from '../utils/municipalityResolver';

export const STORAGE_KEY = 'encuesta-lavalleja-2026-draft-v2';
export const COMPLETED_KEY = 'encuesta-lavalleja-2026-completed-v2';
const steps = z.enum(['welcome', 'age', 'residence', 'location', 'municipalityMembership', 'demographics', 'electoral', 'general', 'areasA', 'areasB', 'concerns', 'priorities', 'municipality', 'comments', 'phone', 'completed', 'notEligible']);
const persistedSchema = z.object({ token: z.string().nullable(), expiresAt: z.string().nullable(), receiptId: z.string().nullable(), currentStep: steps, answers: draftAnswersSchema, completed: z.boolean(), terminated: z.boolean(), startedAt: z.string() });
const emptyAnswers = (): SurveyAnswers => ({ areas: {}, concerns: [], priorities: [] });
function cleanConditionalAnswers(value: SurveyAnswers): SurveyAnswers {
  const answers = { ...value };
  if (answers.adult === 'no') return { ...emptyAnswers(), adult: 'no' };
  if (answers.lavallejaResident === 'no') return { ...emptyAnswers(), adult: answers.adult, lavallejaResident: 'no' };
  const otherZone = answers.locality === 'otra_urbana' || answers.locality === 'otra_rural';
  const invalidMembership = !otherZone && answers.municipality !== undefined
    && (!resolveMunicipality(answers.locality, undefined).known || answers.municipality !== answers.locality);
  if (invalidMembership) answers.municipality = undefined;
  if (invalidMembership || !resolveMunicipality(answers.locality, answers.municipality).known) {
    answers.municipalityEvaluation = undefined;
    answers.municipalitySatisfaction = undefined;
    answers.municipalityEvolution = undefined;
  }
  if (answers.voted2025 !== 'si') answers.party2025 = undefined;
  if (!answers.concerns.includes('otro')) answers.concernOther = undefined;
  return answers;
}
const initial = () => ({ token: null, expiresAt: null, receiptId: null, currentStep: 'welcome' as const, answers: emptyAnswers(), validationContact: null, completed: false, terminated: false, startedAt: '', stepOrder: null });

export function clearDraftStorage() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Browser may deny storage. */ }
}

const surveyState = (simulation = false): StateCreator<SurveyState> => (set) => ({
  ...initial(),
  begin: (token, expiresAt) => set({ ...initial(), token, expiresAt, currentStep: 'age', startedAt: new Date().toISOString() }),
  recoverCompleted: (receiptId) => set({ ...initial(), receiptId, currentStep: 'completed', completed: true }),
  setStep: (requested) => set((state) => ({ currentStep: reachableStep(requested, state.answers) })),
  setStepOrder: (stepOrder) => set({ stepOrder }),
  updateAnswers: (patch) => set((state) => {
    const answers = { ...state.answers, ...patch, areas: { ...state.answers.areas, ...(patch.areas ?? {}) } };
    if ('locality' in patch && patch.locality !== state.answers.locality) {
      answers.municipality = undefined;
      answers.municipalityEvaluation = undefined;
      answers.municipalitySatisfaction = undefined;
      answers.municipalityEvolution = undefined;
    }
    if ('municipality' in patch && patch.municipality !== state.answers.municipality) {
      answers.municipalityEvaluation = undefined;
      answers.municipalitySatisfaction = undefined;
      answers.municipalityEvolution = undefined;
    }
    return { answers: cleanConditionalAnswers(answers) };
  }),
  setContact: (validationContact) => set({ validationContact }),
  clearContact: () => set({ validationContact: null }),
  markCompleted: () => set({ completed: true, terminated: false }),
  markTerminated: () => set({ terminated: true }),
  finalize: (receiptId) => {
    if (simulation) {
      set({ ...initial(), currentStep: 'completed', completed: true, receiptId });
      return;
    }
    try { localStorage.setItem(COMPLETED_KEY, '1'); } catch { /* Server remains authoritative. */ }
    set({ ...initial(), currentStep: 'completed', completed: true, receiptId });
    clearDraftStorage();
  },
  resetAll: () => { set(initial()); if (!simulation) clearDraftStorage(); },
});

const publicSurveyStore = create<SurveyState>()(persist(surveyState(), {
  name: STORAGE_KEY,
  storage: createJSONStorage(() => sessionStorage),
  partialize: ({ token, expiresAt, receiptId, currentStep, answers, completed, terminated, startedAt }) => ({ token, expiresAt, receiptId, currentStep, answers, completed, terminated, startedAt }),
  merge: (persisted, current) => {
    const parsed = persistedSchema.safeParse(persisted);
    if (!parsed.success) return current;
    const answers = cleanConditionalAnswers(parsed.data.answers);
    const currentStep = reachableStep(parsed.data.currentStep, answers);
    return { ...current, ...parsed.data, answers, currentStep, completed: false, receiptId: null, terminated: currentStep === 'notEligible' };
  },
}));

export const SurveyStoreContext = createContext<StoreApi<SurveyState> | null>(null);
export const createSimulationStore = () => createStore<SurveyState>()(surveyState(true));

// Existing callers and tests keep the public store API. Within a simulation,
// the exact same question components read an isolated, non-persisted store.
export const useSurveyStore = Object.assign(<T>(selector: (state: SurveyState) => T): T => {
  const scoped = useContext(SurveyStoreContext);
  return useStore(scoped ?? publicSurveyStore, selector);
}, publicSurveyStore);
