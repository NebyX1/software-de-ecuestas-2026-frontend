import { z } from 'zod';
import { MAX_COMMENT_LENGTH, MAX_CONCERN_OTHER_LENGTH, MAX_CONCERNS, MAX_PRIORITIES } from '../data/surveyOptions';
import { resolveMunicipality } from '../utils/municipalityResolver';
import { validatePhone } from '../utils/phoneValidator';

export const yesNo = z.enum(['si', 'no']);
export const localityValue = z.enum(['minas', 'solis_de_mataojo', 'jose_pedro_varela', 'mariscala', 'zapican', 'jose_batlle_y_ordonez', 'piraraja', 'otra_urbana', 'otra_rural', 'ns_nc']);
export const membershipValue = z.enum(['solis_de_mataojo', 'jose_pedro_varela', 'mariscala', 'zapican', 'jose_batlle_y_ordonez', 'piraraja', 'no_pertenece', 'no_seguro', 'ns_nc']);
export const genderValue = z.enum(['masculino', 'femenino', 'otro', 'ns_nc']);
export const ageRangeValue = z.enum(['18_22', '23_34', '35_44', '45_54', '55_64', '65_mas']);
export const votedValue = z.enum(['si', 'no', 'no_recuerdo', 'pnr']);
export const partyValue = z.enum(['frente_amplio', 'partido_nacional', 'partido_colorado', 'cabildo_abierto', 'unidad_popular', 'otro', 'no_recuerdo', 'pnr']);
export const fiveScale = z.enum(['muy_buena', 'buena', 'ni_buena_ni_mala', 'mala', 'muy_mala', 'ns_nc']);
export const conformityValue = z.enum(['muy_conforme', 'conforme', 'ni_conforme_ni_disconforme', 'disconforme', 'muy_disconforme', 'ns_nc']);
export const evolutionValue = z.enum(['mucho_mejor', 'algo_mejor', 'aprox_igual', 'algo_peor', 'mucho_peor', 'ns_nc']);
export const concernValue = z.enum(['falta_empleo', 'salarios_ingresos', 'costo_vida', 'oportunidades_jovenes', 'emigracion_jovenes', 'desarrollo_economico', 'estado_calles', 'veredas', 'limpieza_residuos', 'alumbrado_publico', 'seguridad', 'acceso_salud', 'vivienda', 'transporte', 'servicios_rurales', 'medio_ambiente', 'cursos_de_agua', 'atencion_organismos', 'burocracia', 'bienestar_animal', 'educacion', 'otro', 'ninguno', 'ns_nc']);
export const priorityValue = z.enum(['empleo', 'obras', 'camineria', 'limpieza', 'espacios', 'sociales', 'juventud', 'deporte', 'cultura', 'turismo', 'medio_ambiente', 'bienestar_animal', 'atencion', 'digitalizacion', 'descentralizacion', 'desarrollo_rural', 'movilidad', 'alumbrado', 'ordenamiento', 'otro', 'ns_nc']);

export const ageSchema = z.object({ adult: yesNo });
export const residenceSchema = z.object({ lavallejaResident: yesNo });
export const localitySchema = z.object({ locality: localityValue });
export const municipalityMembershipSchema = z.object({ municipality: membershipValue });
export const demographicsSchema = z.object({ gender: genderValue, ageRange: ageRangeValue });
export const electoralSchema = z.object({ voted2025: votedValue, party2025: partyValue.optional() }).superRefine((data, ctx) => {
  if (data.voted2025 === 'si' && !data.party2025) ctx.addIssue({ code: 'custom', message: 'Seleccioná una opción para continuar.', path: ['party2025'] });
  if (data.voted2025 !== 'si' && data.party2025) ctx.addIssue({ code: 'custom', message: 'Esta pregunta solo corresponde si votaste.', path: ['party2025'] });
});
export const generalEvaluationSchema = z.object({ generalEvaluation: fiveScale, generalSatisfaction: conformityValue, managementEvolution: evolutionValue });
export const areasASchema = z.object({
  social: fiveScale, descentralizacion: fiveScale, obras: fiveScale, salud_medio_ambiente: fiveScale,
  juventud_deporte: fiveScale, atencion_ciudadana: fiveScale, limpieza: fiveScale, alumbrado: fiveScale,
});
export const areasBSchema = z.object({
  transito: fiveScale, cultura: fiveScale, turismo: fiveScale, desarrollo_rural: fiveScale,
  desarrollo_economico: fiveScale, ordenamiento_territorial: fiveScale, servicios_digitales: fiveScale,
  modernizacion_gestion_servicios_digitales: fiveScale, transparencia: fiveScale, bienestar_animal: fiveScale,
});
export const areasSchema = areasASchema.extend(areasBSchema.shape).strict();
export const areaKeyValue = areasSchema.keyof();

const unique = (values: string[]) => values.length === new Set(values).size;
export const concernSelection = z.array(concernValue).min(1, 'Seleccioná al menos una opción.').max(MAX_CONCERNS, `Podés elegir hasta ${MAX_CONCERNS} opciones.`)
  .refine(unique, 'Las opciones no pueden repetirse.')
  .refine((values) => !values.some((v) => v === 'ninguno' || v === 'ns_nc') || values.length === 1, 'Ninguno y Ns/Nc son opciones excluyentes.');
export const prioritySelection = z.array(priorityValue).min(1, 'Seleccioná al menos una opción.').max(MAX_PRIORITIES, `Podés elegir hasta ${MAX_PRIORITIES} opciones.`)
  .refine(unique, 'Las opciones no pueden repetirse.')
  .refine((values) => !values.includes('ns_nc') || values.length === 1, 'Ns/Nc es una opción excluyente.');
export const concernsSchema = z.object({ concerns: concernSelection, concernOther: z.string().max(MAX_CONCERN_OTHER_LENGTH).optional() }).superRefine((data, ctx) => {
  if (data.concerns.includes('otro') && !data.concernOther?.trim()) ctx.addIssue({ code: 'custom', message: 'Escribí en el campo "¿Cuál?" qué otro problema te preocupa.', path: ['concernOther'] });
  if (!data.concerns.includes('otro') && data.concernOther?.trim()) ctx.addIssue({ code: 'custom', message: 'El texto solo corresponde cuando seleccionás Otro.', path: ['concernOther'] });
});
export const prioritiesSchema = z.object({ priorities: prioritySelection });
export const municipalitySchema = z.object({ municipalityEvaluation: fiveScale, municipalitySatisfaction: conformityValue, municipalityEvolution: evolutionValue });
export const commentsSchema = z.object({ openComment: z.string().trim().min(1, 'Escribí un comentario para continuar.').max(MAX_COMMENT_LENGTH, `El comentario no puede superar los ${MAX_COMMENT_LENGTH} caracteres.`) });
export const consentSchema = z.object({ consent: z.literal(true, { error: 'Debés aceptar participar para comenzar la encuesta.' }) });
export const phoneSchema = z.object({ phone: z.string().refine((v) => validatePhone(v).valid, 'Ingresá un número de celular uruguayo válido, por ejemplo 099 123 456.') });
export const submissionControlSchema = phoneSchema.extend({ challengeAnswer: z.string().trim().regex(/^\d{1,4}$/, 'Ingresá el resultado de la operación usando solo números.'), website: z.string().max(200) });

export const baseAnswersSchema = z.object({
  adult: z.literal('si'), lavallejaResident: z.literal('si'), locality: localityValue, municipality: membershipValue.optional(),
  ...demographicsSchema.shape,
  voted2025: votedValue, party2025: partyValue.optional(),
  ...generalEvaluationSchema.shape,
  areas: areasSchema, concerns: concernSelection, concernOther: z.string().trim().max(MAX_CONCERN_OTHER_LENGTH).optional(),
  priorities: prioritySelection,
  municipalityEvaluation: fiveScale.optional(), municipalitySatisfaction: conformityValue.optional(), municipalityEvolution: evolutionValue.optional(),
  ...commentsSchema.shape,
}).strict();

export const surveyAnswersSchema = baseAnswersSchema.superRefine((data, ctx) => {
  const electoral = electoralSchema.safeParse(data);
  if (!electoral.success) for (const issue of electoral.error.issues) ctx.addIssue({ code: 'custom', message: issue.message, path: issue.path });
  const concerns = concernsSchema.safeParse(data);
  if (!concerns.success) for (const issue of concerns.error.issues) ctx.addIssue({ code: 'custom', message: issue.message, path: issue.path });
  const needsMembership = data.locality === 'otra_urbana' || data.locality === 'otra_rural';
  if (needsMembership && !data.municipality) ctx.addIssue({ code: 'custom', message: 'Respondé la pregunta sobre tu municipio.', path: ['municipality'] });
  if (!needsMembership && data.municipality
    && (!resolveMunicipality(data.locality, undefined).known || data.municipality !== data.locality)) {
    ctx.addIssue({ code: 'custom', message: 'El municipio debe corresponder a tu localidad.', path: ['municipality'] });
  }
  const municipalityKnown = resolveMunicipality(data.locality, data.municipality).known;
  const municipalFields = ['municipalityEvaluation', 'municipalitySatisfaction', 'municipalityEvolution'] as const;
  for (const field of municipalFields) {
    if (municipalityKnown && !data[field]) ctx.addIssue({ code: 'custom', message: 'Respondé la evaluación de tu municipio.', path: [field] });
    if (!municipalityKnown && data[field]) ctx.addIssue({ code: 'custom', message: 'Esta pregunta no corresponde a tu localidad.', path: [field] });
  }
});

// Validate an untrusted partial browser draft before rehydration.
export const draftAnswersSchema = baseAnswersSchema.partial().extend({ adult: yesNo.optional(), lavallejaResident: yesNo.optional(), areas: areasSchema.partial(), concerns: z.array(concernValue), priorities: z.array(priorityValue) });
export type CompleteSurveyAnswers = z.infer<typeof surveyAnswersSchema>;
