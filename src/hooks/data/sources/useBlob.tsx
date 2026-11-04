import { StoredBlob } from '@/data/models/source/source';
import { getSourceRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useState } from 'react';

const useBlob = (blobId: string) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  const { data } = useQuery<StoredBlob, Error>({
    queryKey: ['blob', blobId],
    queryFn: async () => {
      const sourceRepository = getSourceRepository();
      const blobResult = await sourceRepository.getBlob(blobId);
      if (!blobResult.ok) throw blobResult.error;
      return blobResult.value;
    },
  });

  const onNewUrl = useEffectEvent((url: string) => {
    setThumbUrl(url);
  });

  useEffect(() => {
    if (data) {
      const url = URL.createObjectURL(data.blob);
      onNewUrl(url);
      return () => URL.revokeObjectURL(url); // libère la mémoire quand le composant se détruit
    }
  }, [data]);

  return {
    thumbUrl,
  };
};

export default useBlob;
