import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SurveyCard } from '../components/SurveyCard';
import { RadioQuestion } from '../components/QuestionRadio';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { demographicsSchema, genderValue, ageRangeValue } from '../schemas/surveySchemas';
import { GENDER_OPTIONS, AGE_RANGE_OPTIONS } from '../data/surveyOptions';
import { useSurveyLayout } from '../components/SurveyLayout';

type DemographicsForm = z.infer<typeof demographicsSchema>;

export default function Demographics() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const form = useForm<DemographicsForm>({
    resolver: zodResolver(demographicsSchema),
    defaultValues: {
      gender: answers.gender,
      ageRange: answers.ageRange,
    },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<DemographicsForm> = (data) => {
    updateAnswers({ gender: data.gender, ageRange: data.ageRange });
    setStep('electoral');
  };

  return (
    <SurveyCard>
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-ink">Perfil</h2>
        <p className="mt-1 text-[14px] text-ink-soft">
          Estas preguntas nos ayudan a describir la encuesta en su conjunto.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <RadioQuestion
          name="gender"
          question="¿Con qué género te identificás?"
          options={GENDER_OPTIONS}
          value={form.watch('gender')}
          onChange={(v) => form.setValue('gender', genderValue.parse(v), { shouldValidate: true })}
          error={form.formState.errors.gender}
        />
        <RadioQuestion
          name="ageRange"
          question="¿En qué tramo de edad te encontrás?"
          options={AGE_RANGE_OPTIONS}
          value={form.watch('ageRange')}
          onChange={(v) => form.setValue('ageRange', ageRangeValue.parse(v), { shouldValidate: true })}
          error={form.formState.errors.ageRange}
        />
        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
