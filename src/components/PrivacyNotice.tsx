import { CheckCircle2, Info, Lock, Smartphone } from 'lucide-react';

export function PrivacyNotice() {
  return (
    <div className="rounded-2xl border border-[#E2E0EC] bg-white p-4 text-[13px] leading-relaxed text-ink-soft sm:p-5">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-2">
          <p className="font-semibold text-ink">Tu progreso se guarda en esta pestaña mientras respondés.</p>
          <ul className="list-none space-y-1.5">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-[15px] w-[15px] shrink-0 text-primary" aria-hidden="true" />
              <span>
                Laboratorio Demoscópico realiza el relevamiento. La información se utilizará exclusivamente con fines
                estadísticos y de análisis.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-[15px] w-[15px] shrink-0 text-primary" aria-hidden="true" />
              <span>Los datos no serán vendidos ni utilizados con fines comerciales.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-[15px] w-[15px] shrink-0 text-primary" aria-hidden="true" />
              <span>Las respuestas individuales no serán publicadas ni asociadas públicamente con tu identidad.</span>
            </li>
            <li className="flex items-start gap-2">
              <Smartphone className="mt-0.5 h-[15px] w-[15px] shrink-0 text-primary" aria-hidden="true" />
              <span>
                El celular solicitado al final se usa para control de calidad; comprobamos su formato y evitamos repeticiones. Se mantiene
                separado de tus respuestas de opinión.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Info className="mt-0.5 h-[15px] w-[15px] shrink-0 text-primary" aria-hidden="true" />
              <span>
                Las preguntas sobre comportamiento electoral cuentan con la opción "Prefiero no responder / Ns/Nc" para
                quienes no quieran responderlas.
              </span>
            </li>
          </ul>
          <p>
            Al enviar registramos información técnica que informa tu navegador: tipo de dispositivo, sistema operativo,
            navegador, modelo cuando está disponible, idioma, zona horaria y dimensiones de pantalla. Se utiliza para
            control de calidad y análisis técnico; puede ser aproximada y no acredita tu identidad.
          </p>
          <p className="font-medium text-ink">
            Tus respuestas serán tratadas de forma confidencial y los datos de contacto utilizados para validación se
            mantendrán separados de tus respuestas.
          </p>
        </div>
      </div>
    </div>
  );
}
