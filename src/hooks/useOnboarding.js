import { useQuery } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';
import { api } from '../api';

// staleTime corto a propósito: DashboardPage se desmonta/remonta al navegar
// entre tabs (mismo patrón que el resto de las páginas, ver App.jsx), así
// que volver a montar ya dispara un refetch en cuanto el dato pasa a stale —
// sin esto, completar un paso en otra página y volver no actualizaría el banner.
export const useOnboarding = ({ user }) => {
  const statusQ = useQuery({
    queryKey: qk.onboarding(),
    queryFn:  () => api.getOnboardingStatus(),
    enabled:  !!user,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const status = statusQ.data ?? { hasMenu: false, hasMesas: false, hasPedido: false, isComplete: false };

  return {
    status,
    isComplete: status.isComplete,
    isLoading: statusQ.isLoading,
  };
};
