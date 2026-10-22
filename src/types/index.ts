export type AdultAnswer = 'yes' | 'no';
export type ResidentAnswer = 'yes' | 'no';

export type LocalityId =
  | 'minas'
  | 'solis_de_mataojo'
  | 'jose_pedro_varela'
  | 'mariscala'
  | 'zapican'
  | 'jose_batlle_y_ordonez'
  | 'piraraja'
  | 'otra_urbana'
  | 'otra_rural'
  | 'ns_nc';

export type MunicipalityId =
  | 'jose_pedro_varela'
  | 'solis_de_mataojo'
  | 'jose_batlle_y_ordonez'
  | 'mariscala'
  | 'piraraja'
  | 'zapican';

export type MunicipalityMembershipAnswer =
  | MunicipalityId
  | 'no_pertenece'
  | 'no_seguro'
  | 'ns_nc';

export type Gender = 'masculino' | 'femenino' | 'otro' | 'ns_nc';

export type AgeRange =
  | '18_22'
  | '23_34'
  | '35_44'
  | '45_54'
  | '55_64'
  | '65_mas';

export type Voted2025 = 'si' | 'no' | 'no_recuerdo' | 'pnr';

export type Party2025 =
  | 'frente_amplio'
  | 'partido_nacional'
  | 'partido_colorado'
  | 'cabildo_abierto'
  | 'unidad_popular'
  | 'otro'
  | 'no_recuerdo'
  | 'pnr';

export type Likert5 = number | null;

export type FiveScale =
  | 'muy_buena'
  | 'buena'
  | 'ni_buena_ni_mala'
  | 'mala'
  | 'muy_mala'
  | 'ns_nc';

export type ConformityScale =
  | 'muy_conforme'
  | 'conforme'
  | 'ni_conforme_ni_disconforme'
  | 'disconforme'
  | 'muy_disconforme'
  | 'ns_nc';

export type EvolutionScale =
  | 'mucho_mejor'
  | 'algo_mejor'
  | 'aprox_igual'
  | 'algo_peor'
  | 'mucho_peor'
  | 'ns_nc';

export type AreaKey =
  | 'social'
  | 'descentralizacion'
  | 'obras'
  | 'salud_medio_ambiente'
  | 'juventud_deporte'
  | 'atencion_ciudadana'
  | 'limpieza'
  | 'alumbrado'
  | 'transito'
  | 'cultura'
  | 'turismo'
  | 'desarrollo_rural'
  | 'desarrollo_economico'
  | 'ordenamiento_territorial'
  | 'servicios_digitales'
  | 'modernizacion_gestion_servicios_digitales'
  | 'transparencia'
  | 'bienestar_animal';

export type ConcernId =
  | 'falta_empleo'
  | 'salarios_ingresos'
  | 'costo_vida'
  | 'oportunidades_jovenes'
  | 'emigracion_jovenes'
  | 'desarrollo_economico'
  | 'estado_calles'
  | 'veredas'
  | 'limpieza_residuos'
  | 'alumbrado_publico'
  | 'seguridad'
  | 'acceso_salud'
  | 'vivienda'
  | 'transporte'
  | 'servicios_rurales'
  | 'medio_ambiente'
  | 'cursos_de_agua'
  | 'atencion_organismos'
  | 'burocracia'
  | 'bienestar_animal'
  | 'educacion'
  | 'otro'
  | 'ninguno'
  | 'ns_nc';

export type PriorityId =
  | 'empleo'
  | 'obras'
  | 'camineria'
  | 'limpieza'
  | 'espacios'
  | 'sociales'
  | 'juventud'
  | 'deporte'
  | 'cultura'
  | 'turismo'
  | 'medio_ambiente'
  | 'bienestar_animal'
  | 'atencion'
  | 'digitalizacion'
  | 'descentralizacion'
  | 'desarrollo_rural'
  | 'movilidad'
  | 'alumbrado'
  | 'ordenamiento'
  | 'otro'
  | 'ns_nc';

export interface SurveyAnswers {
  adult?: 'si' | 'no';
  lavallejaResident?: 'si' | 'no';
  locality?: LocalityId;
  municipality?:
    | MunicipalityId
    | 'no_pertenece'
    | 'no_seguro'
    | 'ns_nc';
  gender?: Gender;
  ageRange?: AgeRange;
  voted2025?: Voted2025;
  party2025?: Party2025;
  generalEvaluation?: FiveScale;
  generalSatisfaction?: ConformityScale;
  managementEvolution?: EvolutionScale;
  areas: Partial<Record<AreaKey, FiveScale>>;
  concerns: ConcernId[];
  concernOther?: string;
  priorities: PriorityId[];
  municipalityEvaluation?: FiveScale;
  municipalitySatisfaction?: ConformityScale;
  municipalityEvolution?: EvolutionScale;
  openComment?: string;
}

export interface ValidationContact {
  phone: string;
  normalizedPhone: string;
  completedAt: string;
}

export interface SurveyState {
  token: string | null;
  expiresAt: string | null;
  receiptId: string | null;
  begin: (token: string, expiresAt: string) => void;
  recoverCompleted: (receiptId: string | null) => void;
  currentStep: StepId;
  answers: SurveyAnswers;
  validationContact: ValidationContact | null;
  completed: boolean;
  terminated: boolean;
  startedAt: string;
  stepOrder: StepId[] | null;
  setStep: (step: StepId) => void;
  setStepOrder: (order: StepId[]) => void;
  updateAnswers: (patch: Partial<SurveyAnswers>) => void;
  setContact: (contact: ValidationContact) => void;
  clearContact: () => void;
  markCompleted: () => void;
  finalize: (receiptId: string) => void;
  markTerminated: () => void;
  resetAll: () => void;
}

export type StepId =
  | 'welcome'
  | 'age'
  | 'residence'
  | 'location'
  | 'municipalityMembership'
  | 'demographics'
  | 'electoral'
  | 'general'
  | 'areasA'
  | 'areasB'
  | 'concerns'
  | 'priorities'
  | 'municipality'
  | 'comments'
  | 'phone'
  | 'completed'
  | 'notEligible';
