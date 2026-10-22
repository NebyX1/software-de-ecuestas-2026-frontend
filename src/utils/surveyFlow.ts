import type { StepId, SurveyAnswers } from '../types';
import {
  ageSchema, residenceSchema, localitySchema, municipalityMembershipSchema,
  demographicsSchema, electoralSchema, generalEvaluationSchema, areasASchema,
  areasBSchema, concernsSchema, prioritiesSchema, municipalitySchema, commentsSchema,
} from '../schemas/surveySchemas';
import { getStepSequence } from './stepFlow';
import { resolveMunicipality } from './municipalityResolver';

function stepComplete(step: StepId, answers: SurveyAnswers): boolean {
  switch (step) {
    case 'age': return ageSchema.safeParse(answers).success;
    case 'residence': return residenceSchema.safeParse(answers).success;
    case 'location': {
      const matchingMunicipality = answers.municipality === undefined
        || (resolveMunicipality(answers.locality, undefined).known && answers.municipality === answers.locality)
        || answers.locality === 'otra_urbana' || answers.locality === 'otra_rural';
      return localitySchema.safeParse(answers).success && matchingMunicipality;
    }
    case 'municipalityMembership': return municipalityMembershipSchema.safeParse(answers).success;
    case 'demographics': return demographicsSchema.safeParse(answers).success;
    case 'electoral': return electoralSchema.safeParse(answers).success;
    case 'general': return generalEvaluationSchema.safeParse(answers).success;
    case 'areasA': return areasASchema.safeParse(answers.areas).success;
    case 'areasB': return areasBSchema.safeParse(answers.areas).success;
    case 'concerns': return concernsSchema.safeParse(answers).success;
    case 'priorities': return prioritiesSchema.safeParse(answers).success;
    case 'municipality': return resolveMunicipality(answers.locality, answers.municipality).known
      && municipalitySchema.safeParse(answers).success;
    case 'comments': return commentsSchema.safeParse(answers).success;
    default: return false;
  }
}

/** A draft's saved screen is untrusted. Only show a step after its prerequisites.
 * Completion is handled separately after the server acknowledges the response.
 */
export function reachableStep(requested: StepId, answers: SurveyAnswers): StepId {
  const sequence = getStepSequence(answers);
  let target = requested;
  if (target === 'welcome') target = 'age';
  if (target === 'completed') target = 'phone';
  if (!sequence.includes(target)) {
    if (sequence.includes('notEligible')) target = 'notEligible';
    else if (target === 'municipalityMembership') target = 'demographics';
    else if (target === 'municipality') target = 'comments';
    else target = 'phone';
  }
  for (const step of sequence.slice(1)) {
    if (step === target || step === 'notEligible') return step;
    if (!stepComplete(step, answers)) return step;
  }
  return 'age';
}
