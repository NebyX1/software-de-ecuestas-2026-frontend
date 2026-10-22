import { beforeEach, describe, expect, it } from 'vitest';
import { COMPLETED_KEY, STORAGE_KEY, useSurveyStore, createSimulationStore } from './surveyStore';

beforeEach(() => { useSurveyStore.getState().resetAll(); localStorage.clear(); sessionStorage.clear(); });
describe('draft security', () => {
  it('does not preselect age and residence', () => {
    expect(useSurveyStore.getState().answers.adult).toBeUndefined();
    expect(useSurveyStore.getState().answers.lavallejaResident).toBeUndefined();
  });
  it('stores opinions only in this tab and never persists contact', () => {
    useSurveyStore.getState().begin('personal-token', '2026-12-01T00:00:00Z');
    useSurveyStore.getState().updateAnswers({ openComment: 'Opinión sensible' });
    useSurveyStore.getState().setContact({ phone: '099123456', normalizedPhone: '+59899123456', completedAt: '' });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.getItem(STORAGE_KEY)).toContain('Opinión sensible');
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toContain('99123456');
  });
  it('clears incompatible dependent answers', () => {
    const store = useSurveyStore.getState();
    store.updateAnswers({ locality: 'mariscala' });
    store.updateAnswers({ municipalityEvaluation: 'buena', municipalitySatisfaction: 'conforme', municipalityEvolution: 'algo_mejor' });
    store.updateAnswers({ locality: 'minas' });
    expect(useSurveyStore.getState().answers.municipalityEvaluation).toBeUndefined();
    store.updateAnswers({ voted2025: 'si', party2025: 'pnr' });
    store.updateAnswers({ voted2025: 'no' });
    expect(useSurveyStore.getState().answers.party2025).toBeUndefined();
  });
  it('erases draft and contact only after acknowledged completion', () => {
    useSurveyStore.getState().updateAnswers({ openComment: 'Texto' });
    useSurveyStore.getState().finalize('receipt-123');
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(COMPLETED_KEY)).toBe('1');
    expect(useSurveyStore.getState().receiptId).toBe('receipt-123');
    expect(useSurveyStore.getState().answers.openComment).toBeUndefined();
  });
});

describe('simulation isolation', () => {
  it('does not read, change or clear public drafts, completion markers or browser storage', () => {
    useSurveyStore.getState().begin('real-token', '2026-12-01T00:00:00Z');
    useSurveyStore.getState().updateAnswers({ openComment: 'Borrador real' });
    localStorage.setItem(COMPLETED_KEY, '1');
    const publicDraft = sessionStorage.getItem(STORAGE_KEY);
    const simulation = createSimulationStore();
    simulation.getState().begin('simulation-token', '2026-12-01T00:00:00Z');
    simulation.getState().updateAnswers({ openComment: 'Opinión simulada' });
    simulation.getState().finalize('SIMULACION');
    expect(simulation.getState().completed).toBe(true);
    expect(simulation.getState().answers.openComment).toBeUndefined();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(publicDraft);
    expect(localStorage.getItem(COMPLETED_KEY)).toBe('1');
    expect(useSurveyStore.getState().answers.openComment).toBe('Borrador real');
    simulation.getState().resetAll();
    expect(simulation.getState().answers.openComment).toBeUndefined();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(publicDraft);
    expect(localStorage.getItem(COMPLETED_KEY)).toBe('1');
  });

  it('starts a new instance with no answers or completed state', () => {
    const first = createSimulationStore();
    first.getState().updateAnswers({ locality: 'mariscala', municipalityEvaluation: 'buena' });
    first.getState().finalize('SIMULACION');
    const second = createSimulationStore();
    expect(second.getState().currentStep).toBe('welcome');
    expect(second.getState().answers.locality).toBeUndefined();
    expect(second.getState().completed).toBe(false);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
