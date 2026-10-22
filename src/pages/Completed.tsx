import { CheckCircle2 } from 'lucide-react';
import { SurveyCard } from '../components/SurveyCard';
import { SurveyLogo } from '../components/SurveyHeader';
import { useSurveyStore } from '../store/surveyStore';
import { useState } from 'react';
import { useSimulation } from '../features/simulation/context';

export default function Completed() {
  const simulation = useSimulation();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const receiptId = useSurveyStore((s) => s.receiptId);
  return <SurveyCard><div className="flex flex-col items-center py-6 text-center">
    <div className="mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="h-[52px] w-[52px] text-emerald-600" aria-hidden="true" /></div>
    <h2 className="text-[26px] leading-tight font-bold text-ink">{simulation ? 'Simulación finalizada' : '¡Muchas gracias por participar!'}</h2>
    <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-ink-soft">{simulation ? 'El CSV de ejemplo está listo. Las respuestas de esta prueba no fueron guardadas en la base de datos.' : receiptId ? 'Tu respuesta fue registrada correctamente.' : 'Este navegador ya registró su participación en la encuesta.'}</p>
    {!simulation && receiptId && <p className="mt-4 break-all text-[12px] text-ink-faint">Comprobante: {receiptId}</p>}
    {simulation ? <div className="mt-6 flex w-full flex-col gap-3">
      <button type="button" disabled={downloading || !simulation.exportCsv} className="survey-option justify-center bg-primary! font-semibold text-white! disabled:opacity-50" onClick={() => {
        setDownloading(true); setDownloadError('');
        void simulation.download().catch(() => setDownloadError('No pudimos descargar el archivo. Verificá el acceso e intentá nuevamente.')).finally(() => setDownloading(false));
      }}>{downloading ? 'Preparando descarga…' : 'Descargar CSV de ejemplo'}</button>
      <button type="button" className="survey-option justify-center" onClick={simulation.restart}>Volver a probar</button>
      {downloadError && <p role="alert" className="survey-error">{downloadError}</p>}
      <p className="text-[12px] text-ink-faint">Descargá el archivo antes de recargar, salir o reiniciar la prueba.</p>
    </div> : <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-ink-soft">Gracias por dedicar unos minutos a compartir tu opinión.</p>}
    <div className="mt-8 inline-flex flex-col items-center gap-2"><SurveyLogo /><span className="text-[13px] font-semibold text-ink">Laboratorio Demoscópico</span></div>
  </div></SurveyCard>;
}
