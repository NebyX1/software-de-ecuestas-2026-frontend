export function SurveyLogo({ size = 44 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center select-none"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img className="block h-full w-full" src="/logo-laboratorio.svg" alt="" width={size} height={size} />
    </span>
  );
}

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <SurveyLogo />
      <div className="leading-tight">
        <p className="text-sm font-bold text-ink">Laboratorio Demoscópico</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">Estudios de opinión</p>
      </div>
    </div>
  );
}
