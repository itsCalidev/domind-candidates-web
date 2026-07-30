import { QueryClient } from '@tanstack/react-query';

/**
 * Instancia central de TanStack Query.
 *
 * Configuración deliberadamente simple: sin `staleTime` afinado por query,
 * sin persistencia, sin sincronización entre pestañas. Se ajusta cuando
 * aparezca una necesidad real, no antes (evitar optimización prematura).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
