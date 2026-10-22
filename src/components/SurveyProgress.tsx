export interface SurveyProgressProps {
  done: number;
  total: number;
  label: string;
}

export function SurveyProgress({ done, total, label }: SurveyProgressProps) {
  const clamp = total > 0 ? Math.min(Math.max(done / total, 0.03), 1) : 0;
  const percent = Math.round(clamp * 100);

  return (
    <div aria-hidden="true" className="mb-5 flex items-center justify-between gap-4 px-1">
      <div className="survey-progress-track">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-[12px] font-medium whitespace-nowrap text-ink-faint">{label}</span>
    </div>
  );
}
