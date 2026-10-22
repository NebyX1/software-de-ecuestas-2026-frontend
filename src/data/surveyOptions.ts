import type {
  ConcernId,
  AreaKey,
  LocalityId,
  MunicipalityId,
  MunicipalityMembershipAnswer,
  PriorityId,
} from '../types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const LOCALITIES: Option<LocalityId>[] = [
  { value: 'minas', label: 'Minas' },
  { value: 'solis_de_mataojo', label: 'Solís de Mataojo' },
  { value: 'jose_pedro_varela', label: 'José Pedro Varela' },
  { value: 'mariscala', label: 'Mariscala' },
  { value: 'zapican', label: 'Zapicán' },
  { value: 'jose_batlle_y_ordonez', label: 'José Batlle y Ordóñez' },
  { value: 'piraraja', label: 'Pirarajá' },
  { value: 'otra_urbana', label: 'Otra zona urbana' },
  { value: 'otra_rural', label: 'Otra zona rural' },
  { value: 'ns_nc', label: 'Ns/Nc' },
];

export const MUNICIPALITIES: MunicipalityId[] = [
  'jose_pedro_varela',
  'solis_de_mataojo',
  'jose_batlle_y_ordonez',
  'mariscala',
  'piraraja',
  'zapican',
];

export const MUNICIPALITY_LABELS: Record<MunicipalityId, string> = {
  jose_pedro_varela: 'José Pedro Varela',
  solis_de_mataojo: 'Solís de Mataojo',
  jose_batlle_y_ordonez: 'José Batlle y Ordóñez',
  mariscala: 'Mariscala',
  piraraja: 'Pirarajá',
  zapican: 'Zapicán',
};

export const MUNICIPALITY_MEMBERSHIP_OPTIONS: Option<MunicipalityMembershipAnswer>[] = [
  ...MUNICIPALITIES.map((id) => ({ value: id, label: MUNICIPALITY_LABELS[id] })),
  { value: 'no_pertenece', label: 'No pertenece a ninguno' },
  { value: 'no_seguro', label: 'No estoy seguro/a' },
  { value: 'ns_nc', label: 'Ns/Nc' },
];

export const GENDER_OPTIONS: Option<string>[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
  { value: 'ns_nc', label: 'Ns/Nc' },
];

export const AGE_RANGE_OPTIONS: Option<string>[] = [
  { value: '18_22', label: 'De 18 a 22 años' },
  { value: '23_34', label: 'De 23 a 34 años' },
  { value: '35_44', label: 'De 35 a 44 años' },
  { value: '45_54', label: 'De 45 a 54 años' },
  { value: '55_64', label: 'De 55 a 64 años' },
  { value: '65_mas', label: '65 años o más' },
];

export const VOTED_2025_OPTIONS: Option<string>[] = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'no_recuerdo', label: 'No recuerdo' },
  { value: 'pnr', label: 'Prefiero no responder / Ns/Nc' },
];

export const PARTY_2025_OPTIONS: Option<string>[] = [
  { value: 'frente_amplio', label: 'Frente Amplio' },
  { value: 'partido_nacional', label: 'Partido Nacional' },
  { value: 'partido_colorado', label: 'Partido Colorado' },
  { value: 'cabildo_abierto', label: 'Cabildo Abierto' },
  { value: 'unidad_popular', label: 'Unidad Popular' },
  { value: 'otro', label: 'Otros' },
  { value: 'no_recuerdo', label: 'No recuerdo' },
  { value: 'pnr', label: 'Prefiero no responder / Ns/Nc' },
];

export const GENERAL_EVALUATION_OPTIONS: Option<string>[] = [
  { value: 'muy_buena', label: 'Muy buena' },
  { value: 'buena', label: 'Buena' },
  { value: 'ni_buena_ni_mala', label: 'Ni buena ni mala' },
  { value: 'mala', label: 'Mala' },
  { value: 'muy_mala', label: 'Muy mala' },
  { value: 'ns_nc', label: 'Ns/Nc' },
];

export const CONFORMITY_OPTIONS: Option<string>[] = [
  { value: 'muy_conforme', label: 'Muy conforme' },
  { value: 'conforme', label: 'Conforme' },
  { value: 'ni_conforme_ni_disconforme', label: 'Ni conforme ni disconforme' },
  { value: 'disconforme', label: 'Disconforme' },
  { value: 'muy_disconforme', label: 'Muy disconforme' },
  { value: 'ns_nc', label: 'Ns/Nc' },
];

export const EVOLUTION_OPTIONS: Option<string>[] = [
  { value: 'mucho_mejor', label: 'Mucho mejor' },
  { value: 'algo_mejor', label: 'Algo mejor' },
  { value: 'aprox_igual', label: 'Aproximadamente igual' },
  { value: 'algo_peor', label: 'Algo peor' },
  { value: 'mucho_peor', label: 'Mucho peor' },
  { value: 'ns_nc', label: 'Ns/Nc' },
];

export interface AreaDefinition {
  key: AreaKey;
  label: string;
}

export const AREAS_A: AreaDefinition[] = [
  { key: 'social', label: 'Área Social, Inclusión y Género' },
  { key: 'descentralizacion', label: 'Descentralización y Municipios' },
  { key: 'obras', label: 'Obras, Caminería y Mantenimiento Urbano' },
  { key: 'salud_medio_ambiente', label: 'Salud Pública y Medio Ambiente' },
  { key: 'juventud_deporte', label: 'Juventud, Deporte y Políticas de Recreación' },
  { key: 'atencion_ciudadana', label: 'Atención Ciudadana en la Intendencia' },
  { key: 'limpieza', label: 'Limpieza Urbana y Mantenimiento de Espacios Públicos' },
  { key: 'alumbrado', label: 'Alumbrado Público' },
];

export const AREAS_B: AreaDefinition[] = [
  { key: 'transito', label: 'Tránsito, Movilidad y Seguridad Vial' },
  { key: 'cultura', label: 'Cultura y acceso a actividades culturales' },
  { key: 'turismo', label: 'Turismo y promoción del departamento' },
  { key: 'desarrollo_rural', label: 'Desarrollo Rural y atención a zonas rurales' },
  { key: 'desarrollo_economico', label: 'Apoyo al desarrollo económico, comercio y emprendimientos' },
  { key: 'ordenamiento_territorial', label: 'Ordenamiento Territorial y desarrollo urbano' },
  { key: 'servicios_digitales', label: 'Servicios digitales y trámites en línea' },
  { key: 'modernizacion_gestion_servicios_digitales', label: 'Modernización de la Gestión y Servicios Digitales' },
  { key: 'transparencia', label: 'Transparencia, comunicación y acceso a la información' },
  { key: 'bienestar_animal', label: 'Bienestar Animal' },
];

export const CONCERN_OPTIONS: Option<ConcernId>[] = [
  { value: 'falta_empleo', label: 'Falta de empleo' },
  { value: 'salarios_ingresos', label: 'Salarios e ingresos de los hogares' },
  { value: 'costo_vida', label: 'Costo de vida' },
  { value: 'oportunidades_jovenes', label: 'Falta de oportunidades para jóvenes' },
  { value: 'emigracion_jovenes', label: 'Emigración de jóvenes hacia otros departamentos' },
  { value: 'desarrollo_economico', label: 'Desarrollo económico del departamento' },
  { value: 'estado_calles', label: 'Estado de calles y caminos' },
  { value: 'veredas', label: 'Veredas y accesibilidad urbana' },
  { value: 'limpieza_residuos', label: 'Limpieza y gestión de residuos' },
  { value: 'alumbrado_publico', label: 'Alumbrado público' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'acceso_salud', label: 'Acceso a servicios de salud' },
  { value: 'vivienda', label: 'Vivienda' },
  { value: 'transporte', label: 'Transporte y movilidad' },
  { value: 'servicios_rurales', label: 'Servicios en zonas rurales' },
  { value: 'medio_ambiente', label: 'Medio ambiente' },
  { value: 'cursos_de_agua', label: 'Cuidado de cursos de agua' },
  { value: 'atencion_organismos', label: 'Atención y respuesta de organismos públicos' },
  { value: 'burocracia', label: 'Exceso de trámites o burocracia' },
  { value: 'bienestar_animal', label: 'Bienestar animal' },
  { value: 'educacion', label: 'Educación y oportunidades de capacitación' },
  { value: 'otro', label: 'Otro' },
  { value: 'ninguno', label: 'Ninguno en particular' },
  { value: 'ns_nc', label: 'Ns/Nc' },
];

export const PRIORITY_OPTIONS: Option<PriorityId>[] = [
  { value: 'empleo', label: 'Empleo y desarrollo económico' },
  { value: 'obras', label: 'Obras e infraestructura' },
  { value: 'camineria', label: 'Caminería rural' },
  { value: 'limpieza', label: 'Limpieza y residuos' },
  { value: 'espacios', label: 'Espacios públicos' },
  { value: 'sociales', label: 'Políticas sociales' },
  { value: 'juventud', label: 'Juventud' },
  { value: 'deporte', label: 'Deporte' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'turismo', label: 'Turismo' },
  { value: 'medio_ambiente', label: 'Medio ambiente' },
  { value: 'bienestar_animal', label: 'Bienestar animal' },
  { value: 'atencion', label: 'Atención ciudadana' },
  { value: 'digitalizacion', label: 'Digitalización de trámites' },
  { value: 'descentralizacion', label: 'Descentralización' },
  { value: 'desarrollo_rural', label: 'Desarrollo rural' },
  { value: 'movilidad', label: 'Movilidad y tránsito' },
  { value: 'alumbrado', label: 'Alumbrado público' },
  { value: 'ordenamiento', label: 'Ordenamiento territorial' },
  { value: 'otro', label: 'Otro' },
  { value: 'ns_nc', label: 'Ns/Nc' },
];

export const MAX_CONCERNS = 3;
export const MAX_PRIORITIES = 3;
export const MAX_COMMENT_LENGTH = 750;
export const MAX_CONCERN_OTHER_LENGTH = 150;

const CONCERN_TAIL: ConcernId[] = ['otro', 'ninguno', 'ns_nc'];

export function shuffledConcernOptions(): Option<ConcernId>[] {
  const substantial = CONCERN_OPTIONS.filter((o) => !CONCERN_TAIL.includes(o.value));
  const shuffled = [...substantial];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const tails = CONCERN_TAIL.map((id) => CONCERN_OPTIONS.find((o) => o.value === id)).filter(
    (o): o is Option<ConcernId> => Boolean(o),
  );
  return [...shuffled, ...tails];
}
