import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSurveySession } from './features/survey/hooks';
import { ServiceMessage } from './components/ServiceMessage';
import { SurveyCard } from './components/SurveyCard';
import { ApiError } from './lib/axios';
import { reachableStep } from './utils/surveyFlow';
import { COMPLETED_KEY } from './store/surveyStore';
import { SurveyLayout } from './components/SurveyLayout';
import { useSurveyStore } from './store/surveyStore';
import type { StepId } from './types';
import Welcome from './pages/Welcome';
import AgeFilter from './pages/AgeFilter';
import ResidenceFilter from './pages/ResidenceFilter';
import Location from './pages/Location';
import MunicipalityMembership from './pages/MunicipalityMembership';
import Demographics from './pages/Demographics';
import ElectoralBehavior from './pages/ElectoralBehavior';
import GeneralEvaluation from './pages/GeneralEvaluation';
import { AreaEvaluationCard } from './pages/AreaEvaluation';
import Completed from './pages/Completed';
import NotEligible from './pages/NotEligible';
import Comments from './pages/Comments';
import MunicipalityEvaluation from './pages/MunicipalityEvaluation';
import PhoneValidation from './pages/PhoneValidation';
import Priorities from './pages/Priorities';
import Concerns from './pages/Concerns';

export function SurveyStep({ step }: { step: StepId }) {
  switch (step) {
    case 'welcome':
      return <Welcome />;
    case 'age':
      return <AgeFilter />;
    case 'residence':
      return <ResidenceFilter />;
    case 'location':
      return <Location />;
    case 'municipalityMembership':
      return <MunicipalityMembership />;
    case 'demographics':
      return <Demographics />;
    case 'electoral':
      return <ElectoralBehavior />;
    case 'general':
      return <GeneralEvaluation />;
    case 'areasA':
      return <AreaEvaluationCard key="areasA" screen="a" />;
    case 'areasB':
      return <AreaEvaluationCard key="areasB" screen="b" />;
    case 'concerns':
      return <Concerns />;
    case 'priorities':
      return <Priorities />;
    case 'municipality':
      return <MunicipalityEvaluation />;
    case 'comments':
      return <Comments />;
    case 'phone':
      return <PhoneValidation />;
    case 'completed':
      return <Completed />;
    case 'notEligible':
      return <NotEligible />;
    default:
      return <Welcome />;
  }
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const tokenMatch = /^\/s\/([A-Za-z0-9_-]{32,128})\/?$/.exec(location.pathname);
  const routeToken = tokenMatch?.[1] ?? null;
  const token = useSurveyStore((s) => s.token);
  const currentStep = useSurveyStore((s) => s.currentStep);
  const answers = useSurveyStore((s) => s.answers);
  const completed = useSurveyStore((s) => s.completed);
  const setStep = useSurveyStore((s) => s.setStep);
  const activeStep = reachableStep(currentStep, answers);
  const begin = useSurveyStore((s) => s.begin);
  const recoverCompleted = useSurveyStore((s) => s.recoverCompleted);
  const session = useSurveySession(routeToken);
  const base = location.pathname === '/' || location.pathname === '/participar';

  useEffect(() => {
    if (completed || !session.data || session.data.status !== 'active' || token !== routeToken) return;
    if (currentStep !== activeStep) setStep(activeStep);
  }, [activeStep, completed, currentStep, routeToken, session.data, setStep, token]);

  useEffect(() => {
    const completedElsewhere = (event: StorageEvent) => {
      if (event.key === COMPLETED_KEY && event.newValue === '1') recoverCompleted(null);
    };
    window.addEventListener('storage', completedElsewhere);
    return () => window.removeEventListener('storage', completedElsewhere);
  }, [recoverCompleted]);

  useEffect(() => {
    if (currentStep === 'completed' && completed) return;
    if (base) {
      try {
        if (localStorage.getItem(COMPLETED_KEY) === '1') { recoverCompleted(null); return; }
      } catch { /* Storage limitations are handled on entry. */ }
      if (token) navigate(`/s/${token}`, { replace: true });
      return;
    }
    if (!routeToken || !session.data) return;
    if (session.data.status === 'completed') {
      recoverCompleted(session.data.receiptId ?? null);
    } else if (token !== routeToken) {
      begin(routeToken, session.data.expiresAt);
    }
  }, [base, routeToken, token, session.data, currentStep, completed, begin, recoverCompleted, navigate]);

  let content;
  if (currentStep === 'completed' && completed) content = <Completed />;
  else if (base && !token) content = <Welcome />;
  else if (!routeToken && !base) content = <ServiceMessage error={new ApiError('La dirección no corresponde a un enlace de la encuesta.', 'invalid_link')} />;
  else if (session.error) content = <ServiceMessage error={session.error} retry={() => { void session.refetch(); }} />;
  else if (!session.data || token !== routeToken) content = <SurveyCard><p role="status" className="text-ink-soft">Verificando tu enlace personal…</p></SurveyCard>;
  else content = <SurveyStep step={activeStep} />;
  return <SurveyLayout>{content}</SurveyLayout>;
}
