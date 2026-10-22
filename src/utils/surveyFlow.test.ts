import { beforeEach, describe, expect, it } from 'vitest';
import { MUNICIPALITIES, MUNICIPALITY_MEMBERSHIP_OPTIONS } from '../data/surveyOptions';
import { validAnswers } from '../test/fixtures';
import { STORAGE_KEY, useSurveyStore } from '../store/surveyStore';
import type { LocalityId, MunicipalityId, MunicipalityMembershipAnswer, StepId, SurveyAnswers } from '../types';
import { getStepSequence } from './stepFlow';
import { resolveMunicipality } from './municipalityResolver';
import { reachableStep } from './surveyFlow';

const block = { municipalityEvaluation: 'buena', municipalitySatisfaction: 'conforme', municipalityEvolution: 'algo_mejor' } as const;
const municipal = (locality: MunicipalityId): SurveyAnswers => ({ ...validAnswers(), locality, ...block });
const paths: [LocalityId, MunicipalityMembershipAnswer | undefined, boolean][] = [
  ['minas', undefined, false], ['ns_nc', undefined, false],
  ...MUNICIPALITIES.map((id): [LocalityId, undefined, boolean] => [id, undefined, true]),
  ...(['otra_urbana', 'otra_rural'] as const).flatMap(locality => MUNICIPALITY_MEMBERSHIP_OPTIONS.map(
    ({ value }): [LocalityId, MunicipalityMembershipAnswer, boolean] => [locality, value, MUNICIPALITIES.includes(value as MunicipalityId)],
  )),
];

beforeEach(() => { useSurveyStore.getState().resetAll(); sessionStorage.clear(); });

describe('all 26 residential paths', () => {
  it.each(paths)('%s / %s resolves only the declared municipality', (locality, membership, known) => {
    const answers: SurveyAnswers = { ...validAnswers(), locality, municipality: membership };
    const resolution = resolveMunicipality(locality, membership);
    expect(resolution.known).toBe(known);
    expect(resolution.municipality).toBe(known ? membership ?? locality : null);
    expect(getStepSequence(answers).includes('municipality')).toBe(known);
    expect(getStepSequence(answers).includes('municipalityMembership')).toBe(locality.startsWith('otra_'));
    expect(reachableStep('phone', answers)).toBe(known ? 'municipality' : 'phone');
    if (known) expect(reachableStep('phone', { ...answers, ...block })).toBe('phone');
  });
  it.each(['__proto__', 'constructor', 'inventado'])('rejects forged locality or membership %s', value => {
    expect(resolveMunicipality(value as LocalityId, undefined).known).toBe(false);
    expect(resolveMunicipality('otra_rural', value as MunicipalityMembershipAnswer).known).toBe(false);
  });
});

describe('prerequisite guards', () => {
  const missing: [keyof SurveyAnswers, StepId][] = [
    ['adult', 'age'], ['lavallejaResident', 'residence'], ['locality', 'location'],
    ['gender', 'demographics'], ['ageRange', 'demographics'], ['voted2025', 'electoral'],
    ['generalEvaluation', 'general'], ['generalSatisfaction', 'general'], ['managementEvolution', 'general'],
    ['concerns', 'concerns'], ['priorities', 'priorities'], ['openComment', 'comments'],
  ];
  it.each(missing)('cannot reach phone without %s', (field, expected) => {
    const answers = validAnswers(); delete answers[field];
    expect(reachableStep('phone', answers)).toBe(expected);
  });
  it('requires each half of the area matrix in order', () => {
    const answers = validAnswers(); delete answers.areas.social; delete answers.areas.transito;
    expect(reachableStep('phone', answers)).toBe('areasA');
    answers.areas.social = 'ns_nc';
    expect(reachableStep('phone', answers)).toBe('areasB');
  });
  it('requires membership, party and Other only when their parents enable them', () => {
    expect(reachableStep('phone', { ...validAnswers(), locality: 'otra_rural' })).toBe('municipalityMembership');
    expect(reachableStep('phone', { ...validAnswers(), voted2025: 'si' })).toBe('electoral');
    expect(reachableStep('phone', { ...validAnswers(), concerns: ['otro'] })).toBe('concerns');
    expect(reachableStep('phone', { ...validAnswers(), voted2025: 'si', party2025: 'pnr', concerns: ['otro'], concernOther: 'Otra preocupación' })).toBe('phone');
  });
  it.each(['no', 'no_recuerdo', 'pnr'] as const)('cannot keep hidden party when voting is %s', voted2025 => {
    expect(reachableStep('phone', { ...validAnswers(), voted2025, party2025: 'pnr' })).toBe('electoral');
  });
  it('terminates declined age/residence and never asks location or contact', () => {
    expect(reachableStep('phone', { ...validAnswers(), adult: 'no' })).toBe('notEligible');
    expect(reachableStep('municipality', { ...validAnswers(), lavallejaResident: 'no' })).toBe('notEligible');
    expect(getStepSequence({ ...validAnswers(), adult: 'no' })).toEqual(['welcome', 'age', 'notEligible']);
    expect(getStepSequence({ ...validAnswers(), lavallejaResident: 'no' })).toEqual(['welcome', 'age', 'residence', 'notEligible']);
    expect(reachableStep('notEligible', { ...validAnswers(), adult: undefined, lavallejaResident: 'no' })).toBe('age');
  });
  it('skips an inapplicable screen but still requires every preceding answer', () => {
    expect(reachableStep('municipality', validAnswers())).toBe('comments');
    expect(reachableStep('municipalityMembership', validAnswers())).toBe('demographics');
    expect(reachableStep('municipality', { ...validAnswers(), gender: undefined })).toBe('demographics');
    expect(reachableStep('completed', validAnswers())).toBe('phone');
  });
});

describe('changing parents and resuming drafts', () => {
  it.each(MUNICIPALITIES)('changing away from %s erases its three opinions', previous => {
    for (const locality of ['minas', 'ns_nc', ...MUNICIPALITIES.filter(id => id !== previous)] as LocalityId[]) {
      useSurveyStore.setState({ answers: municipal(previous) });
      useSurveyStore.getState().updateAnswers({ locality });
      const answers = useSurveyStore.getState().answers;
      for (const key of Object.keys(block) as (keyof typeof block)[]) expect(answers[key]).toBeUndefined();
      expect(reachableStep('phone', answers)).toBe(MUNICIPALITIES.includes(locality as MunicipalityId) ? 'municipality' : 'phone');
    }
  });
  it.each(MUNICIPALITIES)('confirming unchanged %s preserves its opinions', locality => {
    useSurveyStore.setState({ answers: municipal(locality) });
    useSurveyStore.getState().updateAnswers({ locality });
    expect(useSurveyStore.getState().answers).toMatchObject(block);
  });
  it.each(['no_pertenece', 'no_seguro', 'ns_nc', 'zapican'] as const)('changing declared membership to %s clears old opinions', municipality => {
    useSurveyStore.setState({ answers: { ...validAnswers(), locality: 'otra_rural', municipality: 'mariscala', ...block } });
    useSurveyStore.getState().updateAnswers({ municipality });
    const answers = useSurveyStore.getState().answers;
    expect(answers.municipalityEvaluation).toBeUndefined();
    expect(reachableStep('phone', answers)).toBe(municipality === 'zapican' ? 'municipality' : 'phone');
  });
  it('declining age clears downstream data without inventing a residence response', () => {
    useSurveyStore.setState({ answers: municipal('mariscala') });
    useSurveyStore.getState().updateAnswers({ adult: 'no' });
    expect(useSurveyStore.getState().answers).toEqual({ adult: 'no', areas: {}, concerns: [], priorities: [] });
    useSurveyStore.getState().setStep('phone');
    expect(useSurveyStore.getState().currentStep).toBe('notEligible');
  });
  it('cleans hidden dependent data and distrusts saved completion on rehydration', async () => {
    const answers = { ...validAnswers(), municipality: 'zapican', ...block, party2025: 'pnr', concernOther: 'Texto oculto' };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, state: {
      token: 'a'.repeat(43), expiresAt: '2026-12-01T00:00:00Z', receiptId: 'forged', currentStep: 'completed',
      answers, completed: true, terminated: false, startedAt: '',
    } }));
    await useSurveyStore.persist.rehydrate();
    const state = useSurveyStore.getState();
    expect(state.currentStep).toBe('phone'); expect(state.completed).toBe(false); expect(state.receiptId).toBeNull();
    for (const field of ['municipality', 'party2025', 'concernOther', ...Object.keys(block)] as (keyof SurveyAnswers)[]) expect(state.answers[field]).toBeUndefined();
  });
  it('restores the first unanswered prerequisite instead of the saved final screen', async () => {
    const answers = validAnswers(); delete answers.lavallejaResident;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, state: {
      token: 'a'.repeat(43), expiresAt: null, receiptId: null, currentStep: 'phone', answers,
      completed: false, terminated: false, startedAt: '',
    } }));
    await useSurveyStore.persist.rehydrate();
    expect(useSurveyStore.getState().currentStep).toBe('residence');
  });
});
