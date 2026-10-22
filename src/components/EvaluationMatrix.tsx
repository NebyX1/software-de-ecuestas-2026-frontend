import { useId } from 'react';
import { type FieldError } from 'react-hook-form';
import type { AreaKey, FiveScale } from '../types';
import { GENERAL_EVALUATION_OPTIONS } from '../data/surveyOptions';

export interface MatrixArea {
  key: AreaKey;
  label: string;
}

export interface EvaluationMatrixProps {
  areas: MatrixArea[];
  values: Partial<Record<AreaKey, FiveScale>>;
  onChange: (key: string, value: string) => void;
  error?: FieldError;
}

const COLUMNS = GENERAL_EVALUATION_OPTIONS;

export function EvaluationMatrix({ areas, values, onChange, error }: EvaluationMatrixProps) {
  const matrixId = useId();

  return (
    <div className="space-y-5">
      <div className="hidden overflow-hidden rounded-2xl border border-[#E2E0EC] md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-base-200">
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-semibold text-ink-soft">
                Área
              </th>
              {COLUMNS.map((col) => (
                <th key={col.value} scope="col" className="px-2 py-3 text-center text-[12px] font-semibold text-ink-soft">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map((area, i) => (
              <tr key={area.key} className={i % 2 === 1 ? 'bg-base-100/60' : 'bg-white'}>
                <th scope="row" className="px-4 py-3 text-left text-[14px] leading-snug font-medium text-ink">
                  {area.label}
                </th>
                {COLUMNS.map((col) => {
                  const selected = values[area.key] === col.value;
                  return (
                    <td key={col.value} className="px-2 py-1.5 text-center">
                      <label className="inline-flex cursor-pointer items-center justify-center p-2" data-selected={`${selected}`}>
                        <input
                          type="radio"
                          aria-label={`${area.label}: ${col.label}`}
                          name={`${matrixId}-desktop-${area.key}`}
                          value={col.value}
                          checked={selected}
                          onChange={() => onChange(area.key, col.value)}
                          className="sr-only"
                        />
                        <span className="survey-radio !h-5 !w-5" aria-hidden="true" />
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {areas.map((area) => (
          <fieldset key={area.key} className="rounded-2xl border border-[#E2E0EC] bg-white p-4">
            <legend className="mb-3 text-[15px] leading-snug font-medium text-ink">{area.label}</legend>
            <div className="space-y-2">
              {COLUMNS.map((col) => {
                const selected = values[area.key] === col.value;
                return (
                  <label
                    key={col.value}
                    className="survey-option !min-h-[46px]"
                    data-selected={`${selected}`}
                  >
                    <input
                      type="radio"
                      name={`${matrixId}-${area.key}`}
                      value={col.value}
                      checked={selected}
                      onChange={() => onChange(area.key, col.value)}
                      className="sr-only"
                    />
                    <span className="survey-radio !h-5 !w-5" aria-hidden="true" />
                    <span className="text-[14px] leading-snug text-ink">{col.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error?.message && (
        <p className="survey-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
