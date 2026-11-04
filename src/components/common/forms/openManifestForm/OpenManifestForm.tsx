import Loading from '@/components/common/Loading';
import { SourceWithContent } from '@/data/models/source/source';
import { FormProps } from '@/hooks/ui/useDialog';
import { useState } from 'react';
import AddManifestCard from './AddManifestCard';
import LoadManifestCard from './LoadManifestCard';

type OpenManifestFormProps = FormProps<string> & {
  existingSource?: SourceWithContent;
};

const OpenManifestForm = ({ closeDialog, onResult, existingSource }: OpenManifestFormProps) => {
  const [loadedManifest, setLoadedManifest] = useState(existingSource?.content.manifest);
  const [errorDisplayed, setErrorDisplayed] = useState('');
  const isLoading = false;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className='flex h-full w-full flex-col gap-2'>
      {!existingSource && (
        <LoadManifestCard
          errorDisplayed={errorDisplayed}
          setErrorDisplayed={setErrorDisplayed}
          setLoadedManifest={setLoadedManifest}
        />
      )}
      {loadedManifest && (
        <AddManifestCard
          existingSource={existingSource}
          onResult={onResult}
          closeDialog={closeDialog}
          loadedManifest={loadedManifest}
        />
      )}
    </div>
  );
};

export default OpenManifestForm;
