import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SurveyCard } from '../components/SurveyCard';
import { RadioQuestion } from '../components/QuestionRadio';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { municipalityMembershipSchema, membershipValue } from '../schemas/surveySchemas';
import { MUNICIPALITY_MEMBERSHIP_OPTIONS } from '../data/surveyOptions';
import { useSurveyLayout } from '../components/SurveyLayout';

type MunicipalityMembershipForm = z.infer<typeof municipalityMembershipSchema>;

export default function MunicipalityMembership() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const form = useForm<MunicipalityMembershipForm>({
    resolver: zodResolver(municipalityMembershipSchema),
    defaultValues: { municipality: answers.municipality },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<MunicipalityMembershipForm> = (data) => {
    updateAnswers({ municipality: data.municipality });
    setStep('demographics');
  };

  return (
    <SurveyCard>
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-ink">Tu zona de residencia</h2>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <RadioQuestion
          name="municipality"
          question="¿Tu lugar de residencia pertenece a alguno de estos municipios?"
          options={MUNICIPALITY_MEMBERSHIP_OPTIONS}
          value={form.watch('municipality')}
          onChange={(v) => form.setValue('municipality', membershipValue.parse(v), { shouldValidate: true })}
          error={form.formState.errors.municipality}
        />
        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
