import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HTTP_STATUS } from '../../constants/appConstants';

const NON_RETRYABLE = [HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN, HTTP_STATUS.NOT_FOUND];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => !NON_RETRYABLE.includes(error?.status) && failureCount < 2,
      },
      mutations: { retry: 0 },
    },
  });

export const QueryProvider = ({ children }) => {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProvider;
