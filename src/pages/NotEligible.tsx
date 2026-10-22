import { HeartHandshake } from 'lucide-react';
import { SurveyCard } from '../components/SurveyCard';

export default function NotEligible() {
  return (
    <SurveyCard>
      <div className="flex flex-col items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
          <HeartHandshake className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-[24px] leading-tight font-bold text-ink">Muchas gracias por tu interés en participar.</h2>
        <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-soft">
          En esta oportunidad estamos realizando el relevamiento exclusivamente entre personas de 18 años o más que
          viven en el departamento de Lavalleja.
        </p>
        <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-soft">
          Por ese motivo no podemos continuar con la encuesta en esta ocasión.
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-faint">
          Esta encuesta es realizada por Laboratorio Demoscópico. No se solicita ningún dato de contacto en esta etapa.
        </p>
      </div>
    </SurveyCard>
  );
}
