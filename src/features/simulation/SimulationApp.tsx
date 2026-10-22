import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { SurveyStep } from '../../App';
import { SurveyCard } from '../../components/SurveyCard';
import { Brand } from '../../components/SurveyHeader';
import { SurveyLayout } from '../../components/SurveyLayout';
import { ServiceMessage } from '../../components/ServiceMessage';
import { ApiError, postValidated } from '../../lib/axios';
import { createSimulationStore, SurveyStoreContext, useSurveyStore } from '../../store/surveyStore';
import { reachableStep } from '../../utils/surveyFlow';
import { getSimulationStatus, SIMULATION_SESSION_KEY, simulationStatusSchema, type ActiveSimulation } from './api';
import { SimulationContext } from './context';

const loginSchema = z.object({ email: z.email().max(255), password: z.string().min(1, 'Ingresá la contraseña.').max(128) });

function SimulationLogin({ disabled, message }: { disabled: boolean; message?: string }) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const login = useMutation({ gcTime: 0, mutationFn: (credentials: z.infer<typeof loginSchema>) => postValidated('/api/simulation/login', credentials, simulationStatusSchema),
    onMutate: () => queryClient.cancelQueries({ queryKey: SIMULATION_SESSION_KEY }),
    onSuccess: (data) => { form.reset(); queryClient.setQueryData(SIMULATION_SESSION_KEY, data); } });
  return <div className="min-h-screen bg-[#f4f2f8] px-4 py-10"><div className="mx-auto max-w-[560px]">
    <header className="mb-7"><Brand /></header><SurveyCard>
      <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-primary">Acceso de prueba</p>
      <h1 className="text-[26px] font-bold text-ink">Simular encuesta</h1>
      <p className="mt-3 mb-6 text-[14px] leading-relaxed text-ink-soft">Probá el formulario y descargá el CSV al finalizar. Las respuestas de prueba no se guardan.</p>
      {disabled ? <p role="status" className="rounded-xl border border-primary/25 bg-primary-soft p-4 text-ink">La simulación está deshabilitada. Habilitala desde el panel de administración.</p> : <>
        {message && <p role="status" className="mb-5 text-[14px] text-ink-soft">{message}</p>}
        <form className="space-y-4" onSubmit={(event) => { void form.handleSubmit(async (data) => { try { await login.mutateAsync(data); } catch { /* The mutation renders the error. */ } })(event); }}>
          <label className="block text-[14px] font-semibold text-ink" htmlFor="simulation-email">Correo de administrador</label>
          <input id="simulation-email" type="email" autoComplete="username" className="survey-input" maxLength={255} {...form.register('email')} aria-invalid={Boolean(form.formState.errors.email)} />
          {form.formState.errors.email && <p role="alert" className="survey-error">Ingresá un correo válido.</p>}
          <label className="block text-[14px] font-semibold text-ink" htmlFor="simulation-password">Contraseña</label>
          <input id="simulation-password" type="password" autoComplete="current-password" className="survey-input" maxLength={128} {...form.register('password')} aria-invalid={Boolean(form.formState.errors.password)} />
          {form.formState.errors.password && <p role="alert" className="survey-error">{form.formState.errors.password.message}</p>}
          {login.error && <p role="alert" className="survey-error">{login.error.message}</p>}
          <button type="submit" disabled={login.isPending} className="survey-option w-full justify-center bg-primary! font-semibold text-white! disabled:opacity-50">{login.isPending ? 'Verificando…' : 'Ingresar a la simulación'}</button>
        </form></>}
      <a href="/admin/simulation" className="mt-6 inline-block py-2 text-[14px] text-primary underline">Ir al panel de administración</a>
    </SurveyCard>
  </div></div>;
}

function SimulationForm() {
  const step = useSurveyStore((state) => state.currentStep);
  const answers = useSurveyStore((state) => state.answers);
  const completed = useSurveyStore((state) => state.completed);
  const activeStep = step === 'welcome' || (step === 'completed' && completed) ? step : reachableStep(step, answers);
  return <SurveyLayout><SurveyStep step={activeStep} /></SurveyLayout>;
}

function SimulationSession({ access }: { access: ActiveSimulation }) {
  const [store] = useState(createSimulationStore);
  const [exportCsv, setExportCsv] = useState<Blob | null>(null);
  const queryClient = useQueryClient();
  const submitting = useIsMutating({ mutationKey: ['simulation-submit'] }) > 0;
  const logout = useMutation({ mutationFn: () => postValidated('/api/simulation/logout', {}, simulationStatusSchema),
    onMutate: () => queryClient.cancelQueries({ queryKey: SIMULATION_SESSION_KEY }),
    onSuccess: (data) => { store.getState().resetAll(); setExportCsv(null); queryClient.setQueryData(SIMULATION_SESSION_KEY, data); } });
  const restart = () => {
    store.getState().resetAll();
    setExportCsv(null);
    queryClient.removeQueries({ queryKey: ['simulation-challenge', access.runId] });
  };
  const download = async () => {
    const status = await getSimulationStatus();
    queryClient.setQueryData(SIMULATION_SESSION_KEY, status);
    if (status.status !== 'active' || status.runId !== access.runId || !exportCsv) throw new ApiError('El acceso de prueba terminó. Ingresá nuevamente.', 'simulation_login_required');
    const url = URL.createObjectURL(exportCsv);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `simulacion_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <SurveyStoreContext.Provider value={store}><SimulationContext.Provider value={{ runId: access.runId, expiresAt: access.expiresAt, exportCsv, completeExport: setExportCsv, download, restart }}>
    <aside aria-label="Modo de simulación" className="border-b border-primary/25 bg-primary-soft px-4 py-3 text-[13px] text-ink">
      <div className="mx-auto flex max-w-[740px] flex-wrap items-center gap-x-5 gap-y-2"><strong>Simulación · {access.username}</strong><span>Las respuestas de prueba no se guardan.</span>
        <button type="button" disabled={submitting || logout.isPending} className="py-2 text-primary underline disabled:opacity-50" onClick={restart}>Reiniciar esta prueba</button>
        <button type="button" disabled={submitting || logout.isPending} className="py-2 text-primary underline disabled:opacity-50" onClick={() => logout.mutate()}>Salir de la simulación</button>
        {logout.error && <p role="alert" className="survey-error">{logout.error.message}</p>}
      </div>
    </aside>
    <SimulationForm />
  </SimulationContext.Provider></SurveyStoreContext.Provider>;
}

export default function SimulationApp() {
  const status = useQuery({ queryKey: SIMULATION_SESSION_KEY, queryFn: getSimulationStatus, refetchInterval: 5000, refetchIntervalInBackground: true, refetchOnWindowFocus: true, staleTime: 0, gcTime: 0 });
  if (status.error) return <div className="mx-auto max-w-[780px] p-6"><ServiceMessage error={status.error} retry={() => { void status.refetch(); }} /></div>;
  if (!status.data) return <div className="p-10 text-center" role="status">Verificando el acceso de prueba…</div>;
  if (status.data.status !== 'active') return <SimulationLogin disabled={status.data.status === 'disabled'} message={status.data.message} />;
  return <SimulationSession key={status.data.runId + status.data.expiresAt} access={status.data} />;
}
