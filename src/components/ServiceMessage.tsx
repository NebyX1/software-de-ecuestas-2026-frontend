import { SurveyCard } from './SurveyCard';
import { ApiError } from '../lib/axios';

const terminalCodes = new Set(['link_used', 'link_bound', 'link_expired', 'link_invalid', 'duplicate_response', 'invalid_link', 'invalid_device']);
export function ServiceMessage({ error, retry }: { error: Error; retry?: () => void }) {
  const terminal = error instanceof ApiError && terminalCodes.has(error.code);
  const answered = error instanceof ApiError && ['link_used', 'duplicate_response'].includes(error.code);
  const heading = answered ? 'Encuesta respondida' : terminal ? 'Encuesta no disponible' : 'No pudimos continuar';
  const message = answered ? 'Esta encuesta ya fue respondida.' : terminal ? 'Esta encuesta no está disponible.' : 'No pudimos conectar con la encuesta. Volvé a intentar.';
  return <SurveyCard><h1 className="text-[24px] font-bold text-ink">{heading}</h1><p className="mt-4 text-ink-soft" role="alert">{message}</p>{!terminal && retry && <button type="button" className="survey-option mt-6" onClick={retry}>Volver a intentar</button>}</SurveyCard>;
}
