import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SurveyCard } from '../components/SurveyCard';
import { TextareaQuestion } from '../components/TextareaQuestion';
import { NavigationButtons } from '../components/NavigationButtons';
import { useSurveyStore } from '../store/surveyStore';
import { commentsSchema } from '../schemas/surveySchemas';
import { MAX_COMMENT_LENGTH } from '../data/surveyOptions';
import { useSurveyLayout } from '../components/SurveyLayout';

type CommentsForm = z.infer<typeof commentsSchema>;

export default function Comments() {
  const { goBack } = useSurveyLayout();
  const answers = useSurveyStore((s) => s.answers);
  const updateAnswers = useSurveyStore((s) => s.updateAnswers);
  const setStep = useSurveyStore((s) => s.setStep);

  const form = useForm<CommentsForm>({
    resolver: zodResolver(commentsSchema),
    defaultValues: { openComment: '' },
    values: { openComment: answers.openComment ?? '' },
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<CommentsForm> = (data) => {
    updateAnswers({ openComment: data.openComment.trim() });
    setStep('phone');
  };

  return (
    <SurveyCard>
      <h2 className="text-[22px] font-bold text-ink">Para terminar</h2>
      <p className="mb-6 mt-1 max-w-prose text-[14px] leading-relaxed text-ink-soft">
        Casi llegamos. Contanos lo que consideres importante.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TextareaQuestion
          name="openComment"
          question="¿Hay algo que consideres importante sobre Lavalleja o sobre la gestión departamental que no hayamos preguntado?"
          placeholder="Escribí tu comentario…"
          value={form.watch('openComment') ?? ''}
          onChange={(v) => form.setValue('openComment', v, { shouldValidate: true })}
          maxLength={MAX_COMMENT_LENGTH}
          error={form.formState.errors.openComment}
          autoFocus
        />
        <NavigationButtons onBack={goBack} onNext={form.handleSubmit(onSubmit)} />
      </form>
    </SurveyCard>
  );
}
