import { db } from '@/data/db';
import { Manifest } from '@iiif/presentation-3';
import { useEffect, useState } from 'react';

const useManifest = (manifestUrl: string) => {
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const result = await db.storedManifests.get(manifestUrl);
        if (result) {
          setManifest(result.content);
        }
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
