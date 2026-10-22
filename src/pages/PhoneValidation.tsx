import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Smartphone } from 'lucide-react';
import { SurveyCard } from '../components/SurveyCard';
import { useSurveyStore } from '../store/surveyStore';
import { validatePhone } from '../utils/phoneValidator';
import { useSurveyLayout } from '../components/SurveyLayout';
import { submissionControlSchema, surveyAnswersSchema } from '../features/survey/schema';
import { useSurveyChallenge, useSubmitSurvey } from '../features/survey/hooks';
import { ApiError } from '../lib/axios';
import type { StepId } from '../types';
import { useSimulation } from '../features/simulation/context';

const fieldsToStep: Record<string, StepId> = {
  adult: 'age', lavallejaResident: 'residence', locality: 'location', municipality: 'municipalityMembership',
  gender: 'demographics', ageRange: 'demographics', voted2025: 'electoral', party2025: 'electoral',
  generalEvaluation: 'general', generalSatisfaction: 'general', managementEvolution: 'general',
  areas: 'areasA', concerns: 'concerns', concernOther: 'concerns', priorities: 'priorities',
  municipalityEvaluation: 'municipality', municipalitySatisfaction: 'municipality', municipalityEvolution: 'municipality', openComment: 'comments',
};
export default function PhoneValidation() {
  const simulation = useSimulation();
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const token = useSurveyStore((s) => s.token);
  const finalize = useSurveyStore((s) => s.finalize);
  const setStep = useSurveyStore((s) => s.setStep);
  const form = useForm<z.infer<typeof submissionControlSchema>>({ resolver: zodResolver(submissionControlSchema), defaultValues: { phone: '', challengeAnswer: '', website: '' } });
  const challenge = useSurveyChallenge(token);
  const submit = useSubmitSurvey(token);
  const [expired, setExpired] = useState(false);
  const complete = surveyAnswersSchema.safeParse(answers);
  const busy = challenge.isFetching || submit.isPending;
  const currentError = challenge.error ?? submit.error;

  useEffect(() => {
    if (!challenge.data) return;
    const remaining = Date.parse(challenge.data.expiresAt) - Date.now();
    setExpired(remaining <= 0);
    const timer = window.setTimeout(() => setExpired(true), Math.min(Math.max(remaining, 0), 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [challenge.data]);

  const refreshChallenge = async (clearError = true) => {
    form.setValue('challengeAnswer', '');
    form.clearErrors('challengeAnswer');
    if (clearError) submit.reset();
    await challenge.refetch();
  };
  const sendSurvey = form.handleSubmit(async ({ phone, challengeAnswer, website }) => {
    if (!complete.success || !challenge.data || expired || busy) return;
    try {
      const result = await submit.mutateAsync({ phone: validatePhone(phone).normalized, answers: complete.data, challengeId: challenge.data.challengeId, challengeAnswer, website });
      finalize(result.receiptId);
    } catch (error) {
      // A network retry keeps the same request. Rejected controls require a new challenge.
      if (error instanceof ApiError && error.code.startsWith('challenge_')) await refreshChallenge(false);
    }
  });

  return <SurveyCard>
    <h2 className="text-[22px] font-bold text-ink">Validación de la respuesta</h2>
    <div className="mb-6 mt-3 space-y-3 rounded-xl border border-primary/25 bg-primary-soft px-4 py-4 text-[14px] leading-relaxed text-ink">
      <p>{simulation ? 'Usá un número de celular de ejemplo con formato uruguayo para probar la validación. No se guardará ni se incluirá en el CSV.' : 'Para que la respuesta pueda ser considerada válida necesitamos un número de celular uruguayo.'}</p>
      <p>El número será utilizado exclusivamente como mecanismo de control de calidad y validación del relevamiento. No será vendido ni utilizado con fines comerciales.</p>
      <p className="font-medium">El dato de contacto se mantiene separado de tus respuestas de opinión. Comprobamos el formato y evitamos números repetidos; no comprobamos la titularidad del celular.</p>
    </div>
    {!complete.success && <div role="alert" className="mb-5 rounded-xl border border-red-300 p-4"><p>Hay respuestas pendientes o inválidas. Revisalas antes de enviar.</p><button type="button" className="mt-2 underline text-primary" onClick={() => setStep(fieldsToStep[String(complete.error.issues[0]?.path[0])] ?? 'age')}>Revisar respuestas</button></div>}
    <form onSubmit={(event) => { void sendSurvey(event); }} className="space-y-4">
      <label htmlFor="phone" className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Smartphone className="h-[17px] w-[17px] text-primary" aria-hidden="true" />Número de celular</label>
      <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className="survey-input" placeholder="099 123 456" readOnly={submit.isPending} {...form.register('phone')} aria-invalid={Boolean(form.formState.errors.phone)} aria-describedby="phone-help phone-error" />
      <p id="phone-help" className="text-[12px] text-ink-faint">{simulation ? 'Podés reutilizar el mismo número de ejemplo en todas las pruebas.' : 'Obligatorio para el control de calidad. Se admite un solo envío por celular.'}</p>
      {form.formState.errors.phone && <p id="phone-error" role="alert" className="survey-error">{form.formState.errors.phone.message}</p>}
      <fieldset className="mt-6 space-y-3 rounded-xl border border-[#E2E0EC] p-4">
        <legend className="px-1 font-semibold text-ink">Control de seguridad</legend>
        <p id="challenge-help" className="text-[14px] text-ink-soft">Para finalizar, resolvé esta operación.</p>
        {challenge.isFetching && <p role="status" className="text-[14px] text-ink-soft">Preparando la operación…</p>}
        {challenge.data && !challenge.isFetching && <>
          <label htmlFor="challenge-answer" className="block text-[16px] font-semibold text-ink">{challenge.data.question}</label>
          <input id="challenge-answer" type="text" inputMode="numeric" autoComplete="off" maxLength={4} className="survey-input" readOnly={submit.isPending || expired} {...form.register('challengeAnswer')} aria-invalid={Boolean(form.formState.errors.challengeAnswer)} aria-describedby="challenge-help challenge-error" />
          {form.formState.errors.challengeAnswer && <p id="challenge-error" role="alert" className="survey-error">{form.formState.errors.challengeAnswer.message}</p>}
          {expired && <p role="status" className="text-[14px] text-ink-soft">La operación venció. Generá una nueva para continuar.</p>}
        </>}
        <button type="button" disabled={busy} className="py-2 text-primary underline disabled:opacity-50" onClick={() => { void refreshChallenge(); }}>{challenge.error ? 'Volver a cargar la operación' : 'Generar otra operación'}</button>
      </fieldset>
      <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Sitio web</label><input id="website" type="text" autoComplete="off" tabIndex={-1} {...form.register('website')} />
      </div>
      {currentError && <p role="alert" className="survey-error">{currentError.message}</p>}
      <div className="mt-7 flex gap-3"><button type="button" className="survey-option justify-center" disabled={submit.isPending} onClick={goBack}>Volver</button><button type="submit" className="survey-option justify-center bg-primary! text-white! font-semibold disabled:opacity-50" disabled={busy || !challenge.data || expired || !complete.success} aria-busy={submit.isPending}>{submit.isPending ? 'Enviando…' : 'Enviar encuesta'}</button></div>
      <p className="mt-4 text-[12px] text-ink-faint">{simulation ? 'Al finalizar se prepara un CSV de ejemplo. Las respuestas de esta prueba no se guardan en la base de datos.' : 'La confirmación aparece únicamente cuando el servidor registra tu respuesta. Si falla la conexión, podés volver a intentar desde esta pestaña.'}</p>
    </form>
  </SurveyCard>;
}
