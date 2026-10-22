import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SurveyCard } from '../components/SurveyCard';
import { RadioQuestion } from '../components/QuestionRadio';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { generalEvaluationSchema, fiveScale, conformityValue, evolutionValue } from '../schemas/surveySchemas';
import { CONFORMITY_OPTIONS, EVOLUTION_OPTIONS, GENERAL_EVALUATION_OPTIONS } from '../data/surveyOptions';
import { useSurveyLayout } from '../components/SurveyLayout';

type GeneralEvaluationForm = z.infer<typeof generalEvaluationSchema>;

export default function GeneralEvaluation() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const form = useForm<GeneralEvaluationForm>({
    resolver: zodResolver(generalEvaluationSchema),
    defaultValues: {
      generalEvaluation: answers.generalEvaluation,
      generalSatisfaction: answers.generalSatisfaction,
      managementEvolution: answers.managementEvolution,
    },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<GeneralEvaluationForm> = (data) => {
    updateAnswers({
      generalEvaluation: data.generalEvaluation,
      generalSatisfaction: data.generalSatisfaction,
      managementEvolution: data.managementEvolution,
    });
    setStep('areasA');
  };

  return (
    <SurveyCard>
      <h2 className="text-[22px] font-bold text-ink">Evaluación general</h2>
      <p className="mb-6 mt-1 max-w-prose text-[14px] leading-relaxed text-ink-soft">
        Ahora queremos conocer tu opinión sobre la gestión departamental actual.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <RadioQuestion
          name="generalEvaluation"
          question="En términos generales, ¿cómo evaluás la gestión actual de la Intendencia Departamental de Lavalleja?"
          options={GENERAL_EVALUATION_OPTIONS}
          value={form.watch('generalEvaluation')}
          onChange={(v) => form.setValue('generalEvaluation', fiveScale.parse(v), { shouldValidate: true })}
          error={form.formState.errors.generalEvaluation}
        />
        <RadioQuestion
          name="generalSatisfaction"
          question="¿Qué tan conforme estás con la gestión que viene realizando actualmente la Intendencia?"
          options={CONFORMITY_OPTIONS}
          value={form.watch('generalSatisfaction')}
          onChange={(v) => form.setValue('generalSatisfaction', conformityValue.parse(v), { shouldValidate: true })}
          error={form.formState.errors.generalSatisfaction}
        />
        <RadioQuestion
          name="managementEvolution"
          question="Comparando con un año atrás, ¿cómo considerás que está funcionando actualmente la gestión departamental?"
          options={EVOLUTION_OPTIONS}
          value={form.watch('managementEvolution')}
          onChange={(v) => form.setValue('managementEvolution', evolutionValue.parse(v), { shouldValidate: true })}
          error={form.formState.errors.managementEvolution}
        />
        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
