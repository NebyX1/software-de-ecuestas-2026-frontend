import { useMemo } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SurveyCard } from '../components/SurveyCard';
import { CheckboxQuestion } from '../components/QuestionCheckbox';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { concernsSchema, concernValue } from '../schemas/surveySchemas';
import { MAX_CONCERNS, MAX_CONCERN_OTHER_LENGTH, shuffledConcernOptions } from '../data/surveyOptions';
import { useSurveyLayout } from '../components/SurveyLayout';
import type { ConcernId } from '../types';

const EXCLUSIVES: ConcernId[] = ['ninguno', 'ns_nc'];

type ConcernsForm = z.infer<typeof concernsSchema>;

export default function Concerns() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const options = useMemo(() => shuffledConcernOptions(), []);

  const form = useForm<ConcernsForm>({
    resolver: zodResolver(concernsSchema),
    defaultValues: { concerns: [], concernOther: '' },
    values: {
      concerns: answers.concerns,
      concernOther: answers.concernOther ?? '',
    },
    mode: 'onSubmit',
  });

  const concerns = form.watch('concerns');
  const concernOther = form.watch('concernOther');
  const showOtherInput = concerns.includes('otro');

  const handleChange = (values: string[]) => {
    const next = z.array(concernValue).parse(values);
    const hasExclusive = next.some((v) => EXCLUSIVES.includes(v));
    const cleaned = hasExclusive ? next.filter((v) => EXCLUSIVES.includes(v)) : next;
    form.setValue('concerns', cleaned, { shouldValidate: true });
    updateAnswers({
      concerns: cleaned,
      concernOther: cleaned.includes('otro') ? concernOther : undefined,
    });
  };

  const handleOtherText = (value: string) => {
    form.setValue('concernOther', value, { shouldValidate: true });
    updateAnswers({ concernOther: value });
  };

  const onValid = () => {
    updateAnswers({
      concerns,
      concernOther: (concernOther ?? '').trim() || undefined,
    });
    setStep('priorities');
  };

  return (
    <SurveyCard>
      <h2 className="text-[22px] font-bold text-ink">Principales preocupaciones</h2>
      <p className="mb-2 mt-1 max-w-prose text-[14px] leading-relaxed text-ink-soft">
        Pensando en Lavalleja en general, ¿cuáles considerás que son actualmente los principales problemas o
        preocupaciones del departamento?
      </p>
      <p className="mb-6 text-[13px] font-medium text-primary">Podés elegir hasta 3 opciones.</p>

      <form onSubmit={form.handleSubmit(onValid)} className="space-y-6">
        <CheckboxQuestion
          question=""
          options={options}
          values={concerns}
          onChange={handleChange}
          max={MAX_CONCERNS}
          exclusiveValues={EXCLUSIVES}
          error={form.formState.errors.concerns}
        />

        {showOtherInput && (
          <div className="rounded-2xl border border-[#E2E0EC] bg-base-100 p-4">
            <label htmlFor="concernOther" className="mb-2 block text-[14px] font-semibold text-ink">
              ¿Cuál?
            </label>
            <input
              id="concernOther"
              type="text"
              className="survey-input"
              value={concernOther ?? ''}
              maxLength={MAX_CONCERN_OTHER_LENGTH}
              onChange={(e) => handleOtherText(e.target.value)}
              placeholder="Escribí tu preocupación…"
              aria-invalid={form.formState.errors.concernOther ? 'true' : undefined}
              aria-describedby={form.formState.errors.concernOther ? 'concernOther-error' : undefined}
            />
            {form.formState.errors.concernOther && (
              <p id="concernOther-error" className="survey-error" role="alert">
                {form.formState.errors.concernOther.message}
              </p>
            )}
            <p className="mt-1 text-right text-[12px] text-ink-faint">
              {(concernOther ?? '').length} / {MAX_CONCERN_OTHER_LENGTH}
            </p>
          </div>
        )}

        {concerns.length === MAX_CONCERNS && (
          <p className="text-right text-[12px] font-medium text-primary">
            Alcanzaste el máximo de {MAX_CONCERNS} opciones.
          </p>
        )}

        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onValid)} />
      </form>
    </SurveyCard>
  );
}
