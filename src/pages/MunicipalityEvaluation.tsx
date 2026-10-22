import { useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SurveyCard } from '../components/SurveyCard';
import { RadioQuestion } from '../components/QuestionRadio';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { municipalitySchema, fiveScale, conformityValue, evolutionValue } from '../schemas/surveySchemas';
import { CONFORMITY_OPTIONS, EVOLUTION_OPTIONS, GENERAL_EVALUATION_OPTIONS } from '../data/surveyOptions';
import { resolveMunicipality } from '../utils/municipalityResolver';
import { useSurveyLayout } from '../components/SurveyLayout';

type MunicipalityForm = z.infer<typeof municipalitySchema>;

export default function MunicipalityEvaluation() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const resolved = useMemo(
    () => resolveMunicipality(answers.locality, answers.municipality),
    [answers.locality, answers.municipality],
  );

  const mName = resolved.label ?? 'tu municipio';

  const form = useForm<MunicipalityForm>({
    resolver: zodResolver(municipalitySchema),
    defaultValues: {
      municipalityEvaluation: answers.municipalityEvaluation,
      municipalitySatisfaction: answers.municipalitySatisfaction,
      municipalityEvolution: answers.municipalityEvolution,
    },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<MunicipalityForm> = (data) => {
    updateAnswers({
      municipalityEvaluation: data.municipalityEvaluation,
      municipalitySatisfaction: data.municipalitySatisfaction,
      municipalityEvolution: data.municipalityEvolution,
    });
    setStep('comments');
  };

  return (
    <SurveyCard>
      <h2 className="text-[22px] font-bold text-ink">Tu municipio</h2>
      <p className="mb-6 mt-1 max-w-prose text-[14px] leading-relaxed text-ink-soft">
        Como indicaste que vivís en {mName}, queremos conocer también tu opinión sobre la gestión local.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <RadioQuestion
          name="municipalityEvaluation"
          question={`En términos generales, ¿cómo evaluás la gestión actual del Municipio de ${mName}?`}
          options={GENERAL_EVALUATION_OPTIONS}
          value={form.watch('municipalityEvaluation')}
          onChange={(v) => form.setValue('municipalityEvaluation', fiveScale.parse(v), { shouldValidate: true })}
          error={form.formState.errors.municipalityEvaluation}
        />
        <RadioQuestion
          name="municipalitySatisfaction"
          question="¿Qué tan conforme estás con la atención y los servicios que brinda tu municipio?"
          options={CONFORMITY_OPTIONS}
          value={form.watch('municipalitySatisfaction')}
          onChange={(v) => form.setValue('municipalitySatisfaction', conformityValue.parse(v), { shouldValidate: true })}
          error={form.formState.errors.municipalitySatisfaction}
        />
        <RadioQuestion
          name="municipalityEvolution"
          question="Comparando con un año atrás, ¿considerás que tu municipio está funcionando…?"
          options={EVOLUTION_OPTIONS}
          value={form.watch('municipalityEvolution')}
          onChange={(v) => form.setValue('municipalityEvolution', evolutionValue.parse(v), { shouldValidate: true })}
          error={form.formState.errors.municipalityEvolution}
        />
        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
