import { useQuery } from '@tanstack/react-query';

const useMUUrl = (title: string) => {
  return useQuery({
    queryKey: ['mangaupdates-url', title],
    queryFn: async () => {
      const r = await fetch(
        'https://corsproxy.io/?url=' +
          encodeURIComponent('https://api.mangaupdates.com/v1/series/search'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            search: title,
          }),
        },
      );

      if (!r.ok) {
        throw new Error('Not found');
      }

      return (await r.json())['results'][0]['record']['url'];
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export default useMUUrl;
