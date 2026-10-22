import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SurveyCard } from '../components/SurveyCard';
import { RadioQuestion } from '../components/QuestionRadio';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { ageSchema, yesNo } from '../schemas/surveySchemas';

type AgeForm = z.infer<typeof ageSchema>;

export default function AgeFilter() {
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);
  const markTerminated = useSurveyStore((s) => s.markTerminated);

  const form = useForm<AgeForm>({
    resolver: zodResolver(ageSchema),
    defaultValues: { adult: answers.adult },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<AgeForm> = (data) => {
    updateAnswers({ adult: data.adult });
    if (data.adult === 'si') {
      setStep('residence');
    } else {
      markTerminated();
      setStep('notEligible');
    }
  };

  return (
    <SurveyCard>
      <p className="mb-4 text-[12px] font-bold tracking-[0.16em] text-primary uppercase">Antes de comenzar</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <RadioQuestion
          name="adult"
          question="¿Tenés 18 años o más?"
          options={[
            { value: 'si', label: 'Sí' },
            { value: 'no', label: 'No' },
          ]}
          value={form.watch('adult')}
          onChange={(v) => form.setValue('adult', yesNo.parse(v), { shouldValidate: true })}
          error={form.formState.errors.adult}
        />
        <NavigationButtons onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
