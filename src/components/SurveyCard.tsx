import type { ReactNode } from 'react';

export interface SurveyCardProps {
  children: ReactNode;
  accent?: boolean;
}

export function SurveyCard({ children, accent = true }: SurveyCardProps) {
  return (
    <div className="survey-card relative">
      {accent && <div className="absolute inset-x-0 top-0 h-[7px] bg-primary" aria-hidden="true" />}
      <div className="px-5 py-6 sm:px-10 sm:py-9">{children}</div>
    </div>
  );
}
