import { useId, useRef, useEffect } from 'react';
import { type FieldError } from 'react-hook-form';

export interface TextareaQuestionProps {
  name: string;
  question: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  error?: FieldError;
  autoFocus?: boolean;
}

export function TextareaQuestion({
  question,
  placeholder,
  value,
  onChange,
  maxLength,
  error,
  autoFocus,
}: TextareaQuestionProps) {
  const errorId = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const t = window.setTimeout(() => ref.current?.focus(), 350);
      return () => window.clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <div className="space-y-3">
      <label htmlFor={errorId} className="block">
        <span className="text-[17px] font-semibold text-ink sm:text-[18px]">{question}</span>
      </label>
      <textarea
        id={errorId}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={5}
        className="survey-input resize-y"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${errorId}-err` : undefined}
      />
      <div className="flex items-center justify-between gap-3">
        <p id={`${errorId}-err`} className="survey-error">
          {error?.message}
        </p>
        <span
          className={`ml-auto text-[13px] tabular-nums ${value.length === maxLength ? 'font-semibold text-primary' : 'text-ink-faint'}`}
        >
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
