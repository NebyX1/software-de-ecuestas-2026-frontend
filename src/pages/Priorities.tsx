import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { prioritiesSchema, priorityValue } from '../schemas/surveySchemas';
import { SurveyCard } from '../components/SurveyCard';
import { CheckboxQuestion } from '../components/QuestionCheckbox';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { MAX_PRIORITIES, PRIORITY_OPTIONS } from '../data/surveyOptions';
import { resolveMunicipality } from '../utils/municipalityResolver';
import { useSurveyLayout } from '../components/SurveyLayout';
import type { PriorityId } from '../types';

const EXCLUSIVES: PriorityId[] = ['ns_nc'];

export default function Priorities() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const form = useForm<z.infer<typeof prioritiesSchema>>({ resolver: zodResolver(prioritiesSchema), defaultValues: { priorities: answers.priorities } });
  const priorities = form.watch('priorities');

  const handleChange = (values: string[]) => {
    const next = z.array(priorityValue).parse(values);
    const hasExclusive = next.some((v) => EXCLUSIVES.includes(v));
    const cleaned = hasExclusive ? next.filter((v) => EXCLUSIVES.includes(v)) : next;
    form.setValue('priorities', cleaned, { shouldValidate: true });
    updateAnswers({ priorities: cleaned });
  };

  const onSubmit = form.handleSubmit(() => {
    const resolved = resolveMunicipality(answers.locality, answers.municipality);
    setStep(resolved.known ? 'municipality' : 'comments');
  });

  return (
    <SurveyCard>
      <h2 className="text-[22px] font-bold text-ink">Prioridades de gestión</h2>
      <p className="mb-2 mt-1 max-w-prose text-[14px] leading-relaxed text-ink-soft">
        ¿En cuáles de estas áreas considerás que la Intendencia debería concentrar mayor atención durante los próximos
        años?
      </p>
      <p className="mb-6 text-[13px] font-medium text-primary">Máximo 3.</p>

      <form onSubmit={onSubmit} className="space-y-6">
        <CheckboxQuestion
          question=""
          options={PRIORITY_OPTIONS}
          values={priorities}
          onChange={handleChange}
          max={MAX_PRIORITIES}
          exclusiveValues={EXCLUSIVES}
          error={form.formState.errors.priorities}
        />

        {priorities.length === MAX_PRIORITIES && (
          <p className="text-right text-[12px] font-medium text-primary">
            Alcanzaste el máximo de {MAX_PRIORITIES} opciones.
          </p>
        )}

        <NavigationButtons onBack={goBack} onNext={onSubmit} />
      </form>
    </SurveyCard>
  );
}
