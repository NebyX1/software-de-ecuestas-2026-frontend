import { AREAS_A, AREAS_B } from '../data/surveyOptions';
import type { SurveyAnswers } from '../types';

export function validAnswers(): SurveyAnswers {
  return {
    adult: 'si', lavallejaResident: 'si', locality: 'minas', gender: 'femenino', ageRange: '35_44',
    voted2025: 'pnr', generalEvaluation: 'buena', generalSatisfaction: 'conforme', managementEvolution: 'aprox_igual',
    areas: Object.fromEntries([...AREAS_A, ...AREAS_B].map((area) => [area.key, 'ns_nc'])),
    concerns: ['falta_empleo'], priorities: ['empleo'], openComment: 'Más oportunidades de empleo.',
  };
}
