import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ServiceMessage } from '../../components/ServiceMessage';
import { SurveyLayout } from '../../components/SurveyLayout';
import { useSurveyStore } from '../../store/surveyStore';
import { createInvitation, useSurveySecurity } from './hooks';
import { Turnstile } from './components/Turnstile';

/** The campaign address is only an entry point. Questions and consent belong
 * to the personal URL, after the server has checked its browser ownership. */
export function CampaignEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const attachInvitation = useSurveyStore((state) => state.attachInvitation);
  const security = useSurveySecurity(true);
  const sitekey = security.data?.turnstileSiteKey ?? '';
  const [turnstileToken, setTurnstileToken] = useState('');
  const [attempt, setAttempt] = useState(0);

  // QueryClient shares the pending promise across StrictMode mounts. There are
  // deliberately no automatic POST retries on focus, reconnect or remount:
  // duplicate first requests could replace the browser-binding cookie.
  const invitation = useQuery({
    queryKey: ['survey-entry', attempt],
    queryFn: () => createInvitation(turnstileToken || undefined, security.data?.csrf_token),
    enabled: security.isSuccess && (!sitekey || Boolean(turnstileToken)),
    retry: false, retryOnMount: false, refetchOnMount: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
    staleTime: Infinity, gcTime: 0,
  });

  useEffect(() => {
    if (!invitation.data) return;
    // The server only includes this after receiving the signed browser cookie
    // on link creation. Keep that proof in memory; a reload validates anew.
    if (invitation.data.session) {
      queryClient.setQueryData(['survey-session', invitation.data.token], invitation.data.session);
    }
    attachInvitation(invitation.data.token, invitation.data.expiresAt);
    navigate(`/s/${invitation.data.token}`, { replace: true });
  }, [attachInvitation, invitation.data, navigate, queryClient]);

  if (security.error) return <SurveyLayout><ServiceMessage error={security.error} retry={() => { void security.refetch(); }} /></SurveyLayout>;
  if (invitation.error) return <SurveyLayout><ServiceMessage error={invitation.error} retry={() => {
    setTurnstileToken('');
    setAttempt((value) => value + 1);
  }} /></SurveyLayout>;

  if (!sitekey || invitation.data) return null;
  return <Turnstile sitekey={sitekey} onToken={setTurnstileToken} resetKey={attempt} />;
}
