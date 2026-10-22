import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldAlert } from 'lucide-react';
import { SurveyCard } from '../components/SurveyCard';
import { RadioQuestion } from '../components/QuestionRadio';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { PARTY_2025_OPTIONS, VOTED_2025_OPTIONS } from '../data/surveyOptions';
import { electoralSchema, votedValue, partyValue } from '../schemas/surveySchemas';
import { useSurveyLayout } from '../components/SurveyLayout';

type ElectoralForm = {
  voted2025: 'si' | 'no' | 'no_recuerdo' | 'pnr';
  party2025?: 'frente_amplio' | 'partido_nacional' | 'partido_colorado' | 'cabildo_abierto' | 'unidad_popular' | 'otro' | 'no_recuerdo' | 'pnr';
};

export default function ElectoralBehavior() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const [showPartyDraft, setShowPartyDraft] = useState(answers.voted2025 === 'si');

  const form = useForm<ElectoralForm>({
    resolver: zodResolver(electoralSchema),
    defaultValues: {
      voted2025: answers.voted2025,
      party2025: answers.voted2025 === 'si' ? answers.party2025 : undefined,
    },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<ElectoralForm> = (data) => {
    updateAnswers({
      voted2025: data.voted2025,
      party2025: data.voted2025 === 'si' ? data.party2025 : undefined,
    });
    setStep('general');
  };

  const voted = form.watch('voted2025');
  const isVoted = voted === 'si' || showPartyDraft;

  const handleVotedChange = (value: string) => {
    form.setValue('voted2025', votedValue.parse(value), { shouldValidate: true });
    const nextShow = value === 'si';
    setShowPartyDraft(nextShow);
    if (!nextShow) {
      form.setValue('party2025', undefined);
      updateAnswers({ party2025: undefined });
    }
  };

  return (
    <SurveyCard>
      <div className="mb-6 space-y-0">
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary-soft px-4 py-3 text-[13px] leading-relaxed text-ink">
          <ShieldAlert className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
          <p>
            Las siguientes preguntas se utilizan únicamente para análisis estadístico. La información sobre
            comportamiento electoral es sensible; si no querés responderla podés elegir "Prefiero no responder / Ns/Nc".
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <RadioQuestion
          name="voted2025"
          question="¿Votaste en las elecciones departamentales de mayo de 2025?"
          options={VOTED_2025_OPTIONS}
          value={voted}
          onChange={handleVotedChange}
          error={form.formState.errors.voted2025}
        />

        {isVoted && (
          <RadioQuestion
            name="party2025"
            question="¿A qué partido político votaste en la elección departamental de 2025?"
            options={PARTY_2025_OPTIONS}
            value={form.watch('party2025')}
            onChange={(v) => form.setValue('party2025', partyValue.parse(v), { shouldValidate: true })}
            error={form.formState.errors.party2025}
          />
        )}

        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
