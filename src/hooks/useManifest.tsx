import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { convertJsonToManifest } from '../utils/manifest';

const useManifest = (manifestUrl: string): UseQueryResult<object, Error> => {
  return useQuery({
    queryKey: ['manifest', manifestUrl],
    queryFn: async () => {
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch manifest');
      }
      const data = await response.json();
      console.log('data loaded: ', data);

      if (data['@id']) {
        data.id = data['@id'];
      }

      return convertJsonToManifest(data);
    },
  });
};

export default useManifest;
