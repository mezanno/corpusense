import { supabase } from '@/utils/config';
import { AuthError, PostgrestError } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

//TODO : il est possible de générer les types à partir de supabase : npx supabase gen types typescript --project-id <project-id> > supabase-types.ts

export function useUserManifests() {
  const [existingManifests, setExistingManifests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | PostgrestError | null>(null);

  useEffect(() => {
    const fetchStorageData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError(userError);
          setLoading(false);
          return;
        }
        const { data: userFiles, error: userFilesError } = await supabase
          .from('user_files')
          .select()
          .eq('bucket_id', 'corpusense')
          .like('name', '%/manifest.json')
          .eq('owner', user.id);

        if (userFilesError) {
          setError(userFilesError);
        } else if (userFiles !== null && userFiles.length > 0) {
          const urls = userFiles
            .map((file) => {
              if (file.name === null) return '';
              const { data } = supabase.storage.from('corpusense').getPublicUrl(file.name);
              return data.publicUrl;
            })
            .filter((url) => !!url);
          setExistingManifests(urls);
        } else {
          setExistingManifests([]);
        }
      } catch (err) {
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    };

    void fetchStorageData();
  }, []);

  return { existingManifests, loading, error };
}
