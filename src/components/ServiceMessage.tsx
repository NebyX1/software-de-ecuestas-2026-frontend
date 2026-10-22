import { SurveyCard } from './SurveyCard';
import { ApiError } from '../lib/axios';

const terminalCodes = new Set(['link_used', 'link_bound', 'link_expired', 'duplicate_response', 'invalid_link', 'invalid_device']);
export function ServiceMessage({ error, retry }: { error: Error; retry?: () => void }) {
  const terminal = error instanceof ApiError && terminalCodes.has(error.code);
  return <SurveyCard><h1 className="text-[24px] font-bold text-ink">{terminal ? 'Este enlace no está disponible' : 'No pudimos continuar'}</h1><p className="mt-4 text-ink-soft" role="alert">{error.message}</p>{terminal && <p className="mt-4 text-ink-soft">Los enlaces son personales, tienen vencimiento y permiten registrar una sola respuesta. Si lo recibiste de otra persona, no podrás utilizarlo.</p>}{!terminal && retry && <button type="button" className="survey-option mt-6" onClick={retry}>Volver a intentar</button>}</SurveyCard>;
}
