import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SurveyCard } from '../components/SurveyCard';
import { EvaluationMatrix } from '../components/EvaluationMatrix';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { AREAS_A, AREAS_B } from '../data/surveyOptions';
import { useSurveyLayout } from '../components/SurveyLayout';
import { areasSchema, areaKeyValue, fiveScale } from '../schemas/surveySchemas';

const partialAreasSchema = areasSchema.partial();
type AreaForm = { areas: z.infer<typeof partialAreasSchema> };

export function AreaEvaluationCard({ screen }: { screen: 'a' | 'b' }) {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);
  const areas = screen === 'a' ? AREAS_A : AREAS_B;
  const next = screen === 'a' ? 'areasB' : 'concerns';
  const schema = z.object({ areas: partialAreasSchema }).superRefine((data, ctx) => {
    for (const area of areas) if (!data.areas[area.key]) ctx.addIssue({ code: 'custom', message: 'Respondé todas las áreas para continuar. Podés elegir "Ns/Nc" si no sabés.', path: ['areas', area.key] });
  });
  const form = useForm<AreaForm>({ resolver: zodResolver(schema), defaultValues: { areas: answers.areas }, values: { areas: answers.areas } });
  const formValues = form.watch('areas');
  const handleChange = (key: string, value: string) => {
    const parsedKey = areaKeyValue.parse(key);
    const parsedValue = fiveScale.parse(value);
    form.setValue(`areas.${parsedKey}`, parsedValue, { shouldValidate: true });
    updateAnswers({ areas: { [parsedKey]: parsedValue } });
  };
  const onSubmit: SubmitHandler<AreaForm> = () => setStep(next);
  const answeredCount = areas.filter((area) => formValues[area.key]).length;
  const showBanner = form.formState.isSubmitted && answeredCount < areas.length;

  return (
    <SurveyCard>
      <h2 className="text-[22px] font-bold text-ink">Evaluación por áreas</h2>
      <p className="mb-2 mt-1 max-w-prose text-[14px] leading-relaxed text-ink-soft">
        Independientemente de tu evaluación general, queremos saber cómo considerás que está funcionando cada una de las
        siguientes áreas.
      </p>
      <p className="mb-6 text-[13px] font-medium text-primary">
        {screen === 'a' ? 'Parte 1 de 2' : 'Parte 2 de 2'} · {answeredCount}/{areas.length}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EvaluationMatrix
          areas={areas}
          values={formValues}
          onChange={handleChange}
          error={
            showBanner
              ? {
                  message:
                    'Respondé todas las áreas para continuar. Podés elegir "Ns/Nc" si no sabés.',
                  type: 'manual',
                }
              : undefined
          }
        />

        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
