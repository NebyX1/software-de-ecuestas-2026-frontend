import { useId } from 'react';
import type { FieldError } from 'react-hook-form';

export interface RadioQuestionProps {
  name: string;
  question: string;
  description?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
  error?: FieldError;
}

export function RadioQuestion({
  name,
  question,
  description,
  options,
  value,
  onChange,
  error,
}: RadioQuestionProps) {
  const errorId = useId();
  const hintId = useId();

  return (
    <fieldset>
      <legend className="mb-1 text-[17px] font-semibold text-ink sm:text-[18px]">{question}</legend>
      {description && (
        <p id={hintId} className="mb-3 text-[14px] leading-relaxed text-ink-soft">
          {description}
        </p>
      )}
      <div className="mt-3 space-y-2.5" role="radiogroup" aria-describedby={description ? hintId : undefined}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className="survey-option"
              data-selected={`${selected}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? errorId : undefined}
              />
              <span className="survey-radio" aria-hidden="true" />
              <span className="text-[15px] leading-snug text-ink">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error?.message && (
        <p id={errorId} className="survey-error" role="alert">
          {error.message}
        </p>
      )}
    </fieldset>
  );
}
