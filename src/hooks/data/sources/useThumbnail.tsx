import { useCollectionContext } from '@/components/reducers/CollectionContext';
import { getImageForThumbnail } from '@/data/utils/canvas';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSources from './useSources';

const useThumbnail = ({ canvas, sourceId }: { canvas: Canvas; sourceId: string }) => {
  const { t } = useTranslation();
  const { getSourceWithContent } = useSources();
  const { getLocalObjectUrl } = useCollectionContext();

  // 1. Synchronous resolution for standard IIIF canvas thumbnails (0ms delay)
  const syncThumbnail = useMemo(() => {
    return (canvas.thumbnail as IIIFExternalWebResource[]) ?? [getImageForThumbnail(canvas, 200)];
  }, [canvas]);

  // 2. Check if the derived URL is already a remote HTTP(S) URL
  const isRemoteUrl = Boolean(
    syncThumbnail?.[0]?.id?.startsWith('http://') === true ||
    syncThumbnail?.[0]?.id?.startsWith('https://') === true,
  );

  // 3. Query is executed ONLY if resolution of local file handle is needed
  const {
    data: localThumbnail,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'thumbnail',
      sourceId,
      canvas?.id,
      canvas.thumbnail?.[0]?.id,
      getSourceWithContent,
      syncThumbnail,
      t,
      getLocalObjectUrl,
    ],
    queryFn: async ({ signal }): Promise<IIIFExternalWebResource[]> => {
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const sourceWithContentResult = await getSourceWithContent(sourceId);

      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (!sourceWithContentResult.ok) {
        throw new Error(t('error_no_thumbnail'));
      }

      const sourceWithContent = sourceWithContentResult.value;
      const thumb = [...(syncThumbnail ?? [])];

      if (sourceWithContent.content.type === 'local') {
        const thumbPath = canvas.thumbnail?.[0]?.id;
        if (thumbPath === undefined) {
          throw new Error(t('error_no_thumbnail'));
        }

        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const item = { ...thumb[0] };
        item.id = await getLocalObjectUrl(
          thumbPath,
          sourceWithContent.content.localFile.outputDirectoryHandle,
        );
        thumb[0] = item;
      }

      return thumb;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(canvas?.id && sourceId && !isRemoteUrl),
  });

  // Fast path for remote IIIF sources: return immediately in 0ms without async query
  if (isRemoteUrl) {
    return {
      thumbnail: syncThumbnail,
      isLoading: false,
      error: null,
    };
  }

  return {
    thumbnail: localThumbnail ?? syncThumbnail,
    isLoading,
    error: error !== null && error.name !== 'AbortError' ? error.message : null,
  };
};

export default useThumbnail;
