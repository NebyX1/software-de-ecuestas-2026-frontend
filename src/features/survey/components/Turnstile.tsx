import { useEffect, useRef, useState } from 'react';

interface TurnstileApi {
  render(container: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }): string;
  remove(id: string): void;
}
declare global { interface Window { turnstile?: TurnstileApi } }
const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

export function Turnstile({ onToken, resetKey }: { onToken: (token: string) => void; resetKey: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!sitekey) return;
    setError(false);
    let widget: string | undefined;
    let cancelled = false;
    const render = () => {
      if (!cancelled && container.current && window.turnstile) {
        widget = window.turnstile.render(container.current, { sitekey, action: 'survey_start', callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => { onToken(''); setError(true); } });
      }
    };
    let script = document.querySelector<HTMLScriptElement>('#turnstile-api');
    if (window.turnstile) render();
    else {
      if (!script) {
        script = document.createElement('script');
        script.id = 'turnstile-api';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', render);
      script.addEventListener('error', failed);
    }
    function failed() { if (!cancelled) setError(true); }
    return () => {
      cancelled = true;
      script?.removeEventListener('load', render);
      script?.removeEventListener('error', failed);
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [onToken, resetKey]);
  if (!sitekey) return null;
  return <div><div ref={container} />{error && <p role="alert" className="survey-error">No se pudo completar el control de seguridad. Comprobá tu conexión y recargá la página.</p>}</div>;
}
export const turnstileEnabled = Boolean(sitekey);
