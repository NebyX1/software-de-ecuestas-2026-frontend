import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

export interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  submitLabel?: string;
  backLabel?: string;
  submit?: boolean;
  disabled?: boolean;
}

export function NavigationButtons({
  onBack,
  onNext,
  submitLabel = 'Siguiente',
  backLabel = 'Atrás',
  submit = false,
  disabled = false,
}: NavigationButtonsProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#D6D3E3] bg-white px-5 text-[15px] font-semibold text-ink-soft transition-colors hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!onBack}
      >
        <ArrowLeft className="h-[18px] w-[18px]" aria-hidden="true" />
        {backLabel}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-7 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submit ? (
          <>
            {submitLabel}
            <Send className="h-[17px] w-[17px]" aria-hidden="true" />
          </>
        ) : (
          <>
            {submitLabel}
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}
