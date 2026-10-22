import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Brand } from './SurveyHeader';
import { SurveyProgress } from './SurveyProgress';
import { getStepSequence } from '../utils/stepFlow';
import { useSurveyStore } from '../store/surveyStore';
import type { StepId } from '../types';
import { useSimulation } from '../features/simulation/context';

interface LayoutContextValue { stepNumber: number; totalSteps: number; progressDone: number; activeStep: StepId; goBack: () => void; goNext: () => void }
const LayoutContext = createContext<LayoutContextValue | null>(null);
export function useSurveyLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useSurveyLayout must be used within SurveyLayout');
  return ctx;
}
export function SurveyLayout({ children }: { children: ReactNode }) {
  const simulation = useSimulation();
  const mainRef = useRef<HTMLElement>(null);
  const currentStep = useSurveyStore((s) => s.currentStep);
  const answers = useSurveyStore((s) => s.answers);
  const setStep = useSurveyStore((s) => s.setStep);
  const setStepOrder = useSurveyStore((s) => s.setStepOrder);
  const sequence = useMemo(() => getStepSequence(answers), [answers]);
  useEffect(() => { setStepOrder(sequence); }, [sequence, setStepOrder]);
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentStep]);
  const stepIndex = sequence.indexOf(currentStep);
  const stepNumber = Math.max(stepIndex, 0);
  const totalSteps = Math.max(sequence.length - 2, 1);
  const progressDone = ['completed', 'notEligible'].includes(currentStep) ? totalSteps : Math.min(stepNumber, totalSteps);
  const goNext = () => { if (stepIndex >= 0 && stepIndex < sequence.length - 1) setStep(sequence[stepIndex + 1]); };
  const goBack = () => { if (stepIndex > 1) setStep(sequence[stepIndex - 1]); };
  const showProgress = !['welcome', 'completed', 'notEligible'].includes(currentStep);
  return <LayoutContext.Provider value={{ stepNumber, totalSteps, progressDone, activeStep: currentStep, goBack, goNext }}>
    <div className="min-h-screen bg-[#f4f2f8]"><div className="mx-auto flex min-h-screen w-full max-w-[780px] flex-col px-4 pt-6 pb-10 sm:px-6 sm:pt-8">
      <header className="mb-6"><Brand /></header>
      <main ref={mainRef} tabIndex={-1} className="flex-1 scroll-mt-4 outline-none">
        {showProgress && <div className="mb-5"><SurveyProgress done={progressDone} total={totalSteps} label={`Sección ${stepNumber} de ${totalSteps}`} /></div>}
        {children}
      </main>
      <footer className="mt-10 border-t border-[#E2E0EC] pt-5 text-[12px] text-ink-faint">
        <p>© {new Date().getFullYear()} Laboratorio Demoscópico · Lavalleja 2026</p>
        <details className="mt-3"><summary className="cursor-pointer py-3 font-medium text-primary">Información sobre el relevamiento</summary>
          <div className="space-y-3 text-[14px] leading-relaxed text-ink-soft">
            <p>Esta es una encuesta online de participación voluntaria. El tratamiento estadístico, depuración, segmentación y eventual ponderación de los resultados forman parte de etapas posteriores del estudio.</p>
            <p>{simulation ? 'Esta es una prueba habilitada por un administrador. Las respuestas permanecen en memoria durante la prueba y solo se envían para generar el CSV de ejemplo, sin guardarse en la base de datos.' : 'El progreso se guarda solo en esta pestaña mientras completás la encuesta. Usamos un identificador del navegador, una cookie de seguridad y controles de red para limitar respuestas duplicadas. Al enviar, las respuestas se almacenan en el servidor y el dato de validación del celular se mantiene separado de ellas.'}</p>
          </div>
        </details>
      </footer>
    </div></div>
  </LayoutContext.Provider>;
}
