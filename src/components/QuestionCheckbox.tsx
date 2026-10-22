import { useId } from 'react';
import type { FieldError } from 'react-hook-form';

export interface CheckboxQuestionProps {
  name?: string;
  question: string;
  description?: string;
  hint?: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
  exclusiveValues?: string[];
  error?: FieldError | { message?: string };
}

export function CheckboxQuestion({
  question,
  description,
  hint,
  options,
  values,
  onChange,
  max,
  exclusiveValues = [],
  error,
}: CheckboxQuestionProps) {
  const errorId = useId();
  const groupLabelId = useId();

  const handleToggle = (value: string) => {
    const isSelected = values.includes(value);

    if (exclusiveValues.includes(value)) {
      if (isSelected) {
        onChange([]);
      } else {
        onChange([value]);
      }
      return;
    }

    let next = [...values];
    if (isSelected) {
      next = next.filter((v) => v !== value);
    } else {
      next = [...next, value];
    }

    if (exclusiveValues.some((ev) => next.includes(ev))) {
      next = next.filter((v) => !exclusiveValues.includes(v));
    }

    if (max && next.length > max) {
      return;
    }

    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <p id={groupLabelId} className="mb-1 text-[17px] font-semibold text-ink sm:text-[18px]">
          {question}
        </p>
        {description && <p className="mb-3 text-[14px] leading-relaxed text-ink-soft">{description}</p>}
        {hint && <p className="mb-3 text-[13px] font-medium text-primary">{hint}</p>}
      </div>
      <div className="space-y-2.5" role="group" aria-labelledby={groupLabelId}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          const disabled = !selected && !exclusiveValues.includes(option.value) && Boolean(max && values.length >= max);
          return (
            <label
              key={option.value}
              className={`survey-option${disabled ? ' cursor-not-allowed opacity-50' : ''}`}
              data-selected={`${selected}`}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={selected}
                disabled={disabled}
                onChange={() => handleToggle(option.value)}
                className="sr-only"
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? errorId : undefined}
              />
              <span className="survey-checkbox" aria-hidden="true">
                <svg className="survey-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[15px] leading-snug text-ink">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error?.message && (
        <p id={errorId} className="survey-error" role="alert">
          {error.message}
        </p>
      )}    </div>
  );
}
