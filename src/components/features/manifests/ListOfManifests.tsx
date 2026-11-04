import useLiveSources from '@/hooks/data/sources/useLiveSources';
import { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import {
  FloatingPortal,
  flip,
  offset,
  shift,
  useClientPoint,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import { Database } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ManifestThumbnail from './ManifestThumbnail';
import ManifestThumbnailLoop from './ManifestThumbnailFloatingView';

const ListOfManifests = ({ currendManifestId }: { currendManifestId: string }) => {
  const { t } = useTranslation();
  const { remoteSources, localSources } = useLiveSources();

  const sources = useMemo(() => [...localSources, ...remoteSources], [localSources, remoteSources]);

  const activeRef = useRef<HTMLLIElement | null>(null);

  const [hoveredThumbnailBlobId, setHoveredThumbnailBlobId] = useState<string | null>(null);

  const {
    refs: { setReference, setFloating },
    floatingStyles,
    context,
  } = useFloating({
    placement: 'right-start',
    middleware: [offset(16), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  /*
   * Floating UI suit automatiquement la position de la souris.
   *
   * useClientPoint doit recevoir le `context` de useFloating,
   * puis être passé à useInteractions.
   */
  const clientPoint = useClientPoint(context);

  const { getReferenceProps } = useInteractions([clientPoint]);

  useLayoutEffect(() => {
    activeRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [currendManifestId, sources]);

  const setHovered = (thumbnailBlobId: string, isHovered: boolean) => {
    if (isHovered) {
      setHoveredThumbnailBlobId(thumbnailBlobId);
      return;
    }

    if (thumbnailBlobId === hoveredThumbnailBlobId) {
      setHoveredThumbnailBlobId(null);
    }
  };

  return (
    <section
      className='relative flex h-full w-full flex-col rounded-md bg-white/50 p-2'
      aria-label={t('aria_label_manifest_grid')}
    >
      <span className='flex gap-2'>
        <Database />
        <h2 className='text-lg font-bold'>{t('nav_sources')}</h2>
      </span>

      <div className='h-full w-full flex-1 overflow-hidden'>
        <ul
          ref={setReference}
          {...getReferenceProps()}
          className='h-full w-full space-y-1 overflow-y-auto'
          role='list'
        >
          {sources.map((source) => {
            const isActive = currendManifestId === source.id;

            return (
              <li
                ref={(node) => {
                  if (isActive) {
                    activeRef.current = node;
                  }
                }}
                role='listitem'
                key={source.id}
                className={`flex h-10 w-full cursor-pointer items-center gap-1 overflow-hidden rounded-md border transition-colors ${
                  isActive ? 'border-2 border-dashed border-secondary bg-primary' : 'hover:bg-muted'
                }`}
              >
                <Link
                  to={`/${CorpusenseRoutes.MANIFEST}?manifestId=${source.id}`}
                  className='flex h-full w-full items-center gap-2 overflow-hidden'
                >
                  <div
                    className='max-w-20 min-w-20'
                    onMouseEnter={() => setHovered(source.thumbnailBlobId, true)}
                    onMouseLeave={() => setHovered(source.thumbnailBlobId, false)}
                  >
                    <ManifestThumbnail thumbnailBlobId={source.thumbnailBlobId} />
                  </div>

                  <span className={`${isActive ? 'font-black' : ''} min-w-0 truncate`}>
                    {source.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {hoveredThumbnailBlobId !== null && (
          <FloatingPortal>
            {/* pointer-events-none est volontaire. L'aperçu ne doit pas intercepter la souris entre la
            miniature et le reste de la liste. Floating UI recommande explicitement cette propriété
            lorsque le floating element n'est pas interactif. */}
            <div
              ref={setFloating}
              style={floatingStyles}
              className='pointer-events-none z-50 max-h-96 max-w-96 rounded-md bg-white p-1 shadow-lg'
            >
              <ManifestThumbnailLoop thumbnailBlobId={hoveredThumbnailBlobId} />
            </div>
          </FloatingPortal>
        )}
      </div>
    </section>
  );
};

export default ListOfManifests;
