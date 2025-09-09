import { getManifestRepository } from '@/data/repositories/indexeddb/dbFactory';
import { Manifest } from '@iiif/presentation-3';
import { useEffect, useState } from 'react';

const useManifest = (manifestUrl: string) => {
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const m = await getManifestRepository().getById(manifestUrl);
        setManifest(m);
      } catch (error) {
        console.log(error);
      }
    };

    if (manifestUrl) {
      void fetchManifest();
    }
  }, [manifestUrl]);

  return { manifest };
};

export default useManifest;
