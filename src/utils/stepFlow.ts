import type { StepId, SurveyAnswers } from '../types';
import { resolveMunicipality } from './municipalityResolver';

export function getStepSequence(answers: SurveyAnswers): StepId[] {
  const seq: StepId[] = ['welcome', 'age'];
  if (answers.adult === 'no') return [...seq, 'notEligible'];
  seq.push('residence');
  if (answers.lavallejaResident === 'no') return [...seq, 'notEligible'];
  seq.push('location');

  if (answers.locality === 'otra_urbana' || answers.locality === 'otra_rural') {
    seq.push('municipalityMembership');
  }

  seq.push('demographics', 'electoral', 'general', 'areasA', 'areasB', 'concerns', 'priorities');

  const resolved = resolveMunicipality(answers.locality, answers.municipality);
  if (resolved.known) {
    seq.push('municipality');
  }

  seq.push('comments', 'phone', 'completed');
  return seq;
}
