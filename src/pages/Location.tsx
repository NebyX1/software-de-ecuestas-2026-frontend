import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SurveyCard } from '../components/SurveyCard';
import { RadioQuestion } from '../components/QuestionRadio';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { localitySchema, localityValue } from '../schemas/surveySchemas';
import { LOCALITIES } from '../data/surveyOptions';
import { useSurveyLayout } from '../components/SurveyLayout';

type LocationForm = z.infer<typeof localitySchema>;

export default function Location() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const form = useForm<LocationForm>({
    resolver: zodResolver(localitySchema),
    defaultValues: { locality: answers.locality },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<LocationForm> = (data) => {
    const locality = data.locality;
    updateAnswers({ locality });
    const next = locality === 'otra_urbana' || locality === 'otra_rural'
      ? 'municipalityMembership'
      : 'demographics';
    setStep(next);
  };

  return (
    <SurveyCard>
      <p className="mb-4 text-[12px] font-bold tracking-[0.16em] text-primary uppercase">Sobre vos</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <RadioQuestion
          name="locality"
          question="¿En qué localidad o zona del departamento vivís actualmente?"
          options={LOCALITIES}
          value={form.watch('locality')}
          onChange={(v) => form.setValue('locality', localityValue.parse(v), { shouldValidate: true })}
          error={form.formState.errors.locality}
        />
        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
