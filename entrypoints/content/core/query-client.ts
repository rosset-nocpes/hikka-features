import { QueryClient } from '@tanstack/react-query';

/** Shared by every UI the content script mounts, so they share one cache. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});
