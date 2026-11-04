import useBlob from '@/hooks/data/sources/useBlob';
import { FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ManifestThumbnail = ({ thumbnailBlobId }: { thumbnailBlobId: string }) => {
  const { t } = useTranslation();
  const { thumbUrl } = useBlob(thumbnailBlobId);

  if (thumbUrl === null) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-muted'>
        <FileImage size={48} />
      </div>
    );
  }
  return (
    <img
      src={thumbUrl}
      alt={t('aria_label_thumbnail')}
      style={{ objectFit: 'contain' }}
      aria-label={t('aria_label_thumbnail')}
      className='h-full w-full'
    />
  );
};

export default ManifestThumbnail;
