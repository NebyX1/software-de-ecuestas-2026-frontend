import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateInvitation } from '../features/survey/hooks';
import { Turnstile, turnstileEnabled } from '../features/survey/components/Turnstile';
import { SurveyCard } from '../components/SurveyCard';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { useSurveyStore } from '../store/surveyStore';
import { useSimulation } from '../features/simulation/context';

const consentSchema = z.object({
  consent: z
    .boolean()
    .refine((v) => v === true, {
      message: 'Debés aceptar participar para comenzar la encuesta.',
    }),
});

type ConsentForm = z.infer<typeof consentSchema>;

export default function Welcome() {
  const simulation = useSimulation();
  const begin = useSurveyStore((s) => s.begin);
  const navigate = useNavigate();
  const invitation = useCreateInvitation();
  const [turnstileToken, setTurnstileToken] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConsentForm>({
    resolver: zodResolver(consentSchema),
    defaultValues: { consent: false },
  });

  const consented = watch('consent') === true;

  const onSubmit: SubmitHandler<ConsentForm> = async () => {
    try {
      const result = await invitation.mutateAsync(turnstileToken || undefined);
      begin(result.token, result.expiresAt);
      if (!simulation) navigate(`/s/${result.token}`, { replace: true });
    } catch {
      setTurnstileToken('');
      setResetKey((key) => key + 1);
    }
  };

  return (
    <SurveyCard>
      <div className="mb-6 flex items-center gap-3 text-[13px] leading-relaxed text-ink-faint">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary font-extrabold text-white select-none" aria-hidden="true">
          LD
        </span>
        <span className="font-medium">Laboratorio Demoscópico</span>
        <span aria-hidden="true" className="text-base-300">·</span>
        <span>Estudios de opinión</span>
      </div>

      <h2 className="text-[26px] leading-tight font-bold text-ink sm:text-[30px]">
        Encuesta de Evaluación de Gestión Departamental
      </h2>
      <p className="mt-1 mb-6 text-[15px] font-medium text-primary">Lavalleja · 2026</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 text-[14px] leading-relaxed text-ink-soft">
          <p>
            Queremos conocer la opinión de quienes viven en Lavalleja sobre la situación actual del departamento y la
            gestión de sus servicios públicos.
          </p>
          <p>
            La encuesta lleva solamente unos minutos. Tus respuestas serán utilizadas exclusivamente con fines
            estadísticos y de análisis. Laboratorio Demoscópico no vende la información recopilada ni utiliza los datos
            proporcionados con fines comerciales.
          </p>
          <p>
            Las respuestas serán tratadas de forma confidencial. Si completás la encuesta, al finalizar te solicitaremos
            un número de celular para control de calidad y validación. Ese dato se almacenerá separadamente de tus
            respuestas de opinión. Se comprueba su formato y se evitan números repetidos; no se verifica la titularidad.
          </p>
          <p>
            Algunas preguntas se refieren al comportamiento electoral. En esos casos podés responder "Prefiero no
            responder / Ns/Nc" si no querés contestarlas.
          </p>
        </div>

        <PrivacyNotice />

        <div>
          <label className="survey-option" data-selected={`${consented}`}>
            <input
              type="checkbox"
              {...register('consent')}
              className="sr-only"
              aria-invalid={errors.consent ? 'true' : undefined}
            />
            <span className="survey-checkbox" aria-hidden="true">
              <svg className="survey-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[15px] leading-snug text-ink">
              He leído la información anterior y acepto participar voluntariamente en esta encuesta.
            </span>
          </label>
          {errors.consent?.message && (
            <p className="survey-error" role="alert">
              {errors.consent.message}
            </p>
          )}
        </div>

        {!simulation && <Turnstile onToken={setTurnstileToken} resetKey={resetKey} />}
        {invitation.error && <p role="alert" className="survey-error">{invitation.error.message}</p>}

        <button
          type="submit"
          disabled={invitation.isPending || !consented || (!simulation && turnstileEnabled && !turnstileToken)}
          aria-busy={invitation.isPending}
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-7 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          {invitation.isPending ? 'Preparando tu enlace…' : 'Comenzar encuesta'}
        </button>

        <p className="text-center text-[12px] text-ink-faint">
          {simulation ? 'Prueba de la encuesta: las respuestas se pierden al recargar o cerrar esta pestaña.' : 'El progreso se guarda en esta pestaña mientras completás la encuesta. Tu enlace es personal y de un solo uso.'}
        </p>
      </form>
    </SurveyCard>
  );
}
