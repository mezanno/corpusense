import { useCollectionContext } from '@/components/reducers/CollectionContext';
import { getImage } from '@/data/utils/canvas';
import { getErrorMessage } from '@/utils/utils';
import { Canvas, ImageService } from '@iiif/presentation-3';
import { Cozy } from 'cozy-iiif';
import { t } from 'i18next';
import { TileSource } from 'openseadragon';
import { useEffect, useState } from 'react';
import useSources from './useSources';

const useTileSource = ({ canvas, sourceId }: { canvas: Canvas; sourceId: string }) => {
  const [error, setError] = useState<string | null>(null);
  // null = pas encore résolu. OpenSeadragon.open([]) est un no-op silencieux :
  // laisser source à [] monterait un viewer vide sans jamais afficher d'erreur.
  const [source, setSource] = useState<TileSource[] | null>(null);
  const { getSourceWithContent } = useSources();
  const { getLocalObjectUrl } = useCollectionContext();

  useEffect(() => {
    const fetchSource = async () => {
      setError(null);
      setSource(null);
      try {
        const sourceWithContentResult = await getSourceWithContent(sourceId);
        if (!sourceWithContentResult.ok) {
          setError(t('error_source_not_found'));
          return;
        }
        const sourceWithContent = sourceWithContentResult.value;
        const parsedManifest = Cozy.parse(sourceWithContent.content.manifest);

        if (sourceWithContent.content.type === 'local' && parsedManifest.type === 'manifest') {
          const cozyCanvas = parsedManifest.resource.canvases.find((c) => c.id === canvas.id);
          if (cozyCanvas === undefined) {
            setError(`Canvas with id ${canvas.id} not found in manifest`);
            return;
          }
          const imageUrl = cozyCanvas.getImageURL();
          const objectUrl = await getLocalObjectUrl(
            imageUrl,
            sourceWithContent.content.localFile.outputDirectoryHandle,
          );
          setSource([{ url: objectUrl, type: 'image' }] as unknown as TileSource[]);
        } else {
          const image = getImage(canvas);
          const service = image?.service?.[0] as ImageService | undefined;
          const serviceId = service?.['@id'] ?? service?.id;
          if (serviceId !== undefined) {
            setSource([`${serviceId}/info.json`] as unknown as TileSource[]);
          } else if (image?.id !== undefined) {
            // Pas de service IIIF : ouvrir l'image directement (comportement d'avant e09ffca)
            if (image.id.startsWith('http')) {
              setSource([{ type: 'image', url: image.id }] as unknown as TileSource[]);
            } else if (sourceWithContent.content.type === 'local') {
              const objectUrl = await getLocalObjectUrl(
                image.id,
                sourceWithContent.content.localFile.outputDirectoryHandle,
              );
              setSource([{ type: 'image', url: objectUrl }] as unknown as TileSource[]);
            } else {
              setError(t('error_image_not_found'));
            }
          } else {
            setError(t('error_image_not_found'));
          }
        }
      } catch (e) {
        setError(getErrorMessage(e));
        console.error(e);
      }
    };

    void fetchSource();
  }, [canvas.id, sourceId]);

  return { source, error };
};

export default useTileSource;
