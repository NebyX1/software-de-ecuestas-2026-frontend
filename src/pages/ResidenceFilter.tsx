import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SurveyCard } from '../components/SurveyCard';
import { RadioQuestion } from '../components/QuestionRadio';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { residenceSchema, yesNo } from '../schemas/surveySchemas';
import { useSurveyLayout } from '../components/SurveyLayout';

type ResidenceForm = z.infer<typeof residenceSchema>;

export default function ResidenceFilter() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);
  const markTerminated = useSurveyStore((s) => s.markTerminated);

  const form = useForm<ResidenceForm>({
    resolver: zodResolver(residenceSchema),
    defaultValues: { lavallejaResident: answers.lavallejaResident },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<ResidenceForm> = (data) => {
    updateAnswers({ lavallejaResident: data.lavallejaResident });
    if (data.lavallejaResident === 'si') {
      setStep('location');
    } else {
      markTerminated();
      setStep('notEligible');
    }
  };

  return (
    <SurveyCard>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <RadioQuestion
          name="lavallejaResident"
          question="¿Vivís actualmente en el departamento de Lavalleja?"
          options={[
            { value: 'si', label: 'Sí' },
            { value: 'no', label: 'No' },
          ]}
          value={form.watch('lavallejaResident')}
          onChange={(v) => form.setValue('lavallejaResident', yesNo.parse(v), { shouldValidate: true })}
          error={form.formState.errors.lavallejaResident}
        />
        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
