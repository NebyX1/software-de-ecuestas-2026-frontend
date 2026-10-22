import { describe, expect, it } from 'vitest';
import { AREAS_A, AREAS_B } from '../data/surveyOptions';
import { validAnswers } from '../test/fixtures';
import { surveyAnswersSchema, concernsSchema, prioritiesSchema } from './surveySchemas';
import { getStepSequence } from '../utils/stepFlow';
import { validatePhone } from '../utils/phoneValidator';

describe('questionnaire contract', () => {
  it('preserves all 18 required area evaluations including modernization', () => {
    expect([...AREAS_A, ...AREAS_B]).toHaveLength(18);
    expect(surveyAnswersSchema.safeParse(validAnswers()).success).toBe(true);
    const incomplete = validAnswers();
    delete incomplete.areas.modernizacion_gestion_servicios_digitales;
    expect(surveyAnswersSchema.safeParse(incomplete).success).toBe(false);
  });
  it('rejects forged enum values and unknown properties', () => {
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), gender: 'inventado' }).success).toBe(false);
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), administrator: true }).success).toBe(false);
  });
  it('validates election-dependent party instead of accepting a stale answer', () => {
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), voted2025: 'si' }).success).toBe(false);
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), party2025: 'pnr' }).success).toBe(false);
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), voted2025: 'si', party2025: 'pnr' }).success).toBe(true);
  });
  it('requires municipal block only in the correct conditional branches', () => {
    const municipal = { ...validAnswers(), locality: 'mariscala' };
    expect(surveyAnswersSchema.safeParse(municipal).success).toBe(false);
    const evaluated = { ...municipal, municipalityEvaluation: 'buena', municipalitySatisfaction: 'conforme', municipalityEvolution: 'aprox_igual' };
    expect(surveyAnswersSchema.safeParse(evaluated).success).toBe(true);
    expect(surveyAnswersSchema.safeParse({ ...evaluated, locality: 'minas' }).success).toBe(false);
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), locality: 'otra_rural' }).success).toBe(false);
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), locality: 'otra_rural', municipality: 'no_pertenece' }).success).toBe(true);
    expect(getStepSequence({ ...validAnswers(), locality: 'otra_rural', municipality: 'mariscala' })).toContain('municipality');
    expect(getStepSequence(validAnswers())).not.toContain('municipality');
  });
  it('enforces unique bounded checkbox values and exclusivity', () => {
    expect(concernsSchema.safeParse({ concerns: ['ninguno', 'ns_nc'] }).success).toBe(false);
    expect(concernsSchema.safeParse({ concerns: ['costo_vida', 'costo_vida'] }).success).toBe(false);
    expect(concernsSchema.safeParse({ concerns: ['otro'], concernOther: '  ' }).success).toBe(false);
    expect(concernsSchema.safeParse({ concerns: ['ns_nc'], concernOther: 'Texto oculto' }).success).toBe(false);
    expect(prioritiesSchema.safeParse({ priorities: ['ns_nc', 'empleo'] }).success).toBe(false);
    expect(prioritiesSchema.safeParse({ priorities: ['empleo', 'obras', 'camineria', 'limpieza'] }).success).toBe(false);
  });
  it('rejects whitespace-only comments and ineligible respondents', () => {
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), openComment: '   ' }).success).toBe(false);
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), adult: 'no' }).success).toBe(false);
    expect(surveyAnswersSchema.safeParse({ ...validAnswers(), lavallejaResident: 'no' }).success).toBe(false);
  });
});

describe('Uruguayan mobile format', () => {
  it.each(['099 123 456', '+598 99 123 456', '59899123456'])('normalizes %s', (raw) => expect(validatePhone(raw)).toMatchObject({ valid: true, normalized: '+59899123456' }));
  it.each(['abc099123456', '+5499123456', '099123456extra', '059899123456', '+598099123456', ''])('rejects %s', (raw) => expect(validatePhone(raw).valid).toBe(false));
});
