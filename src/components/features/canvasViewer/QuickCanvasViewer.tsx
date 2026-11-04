import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollectionContent } from '@/hooks/data/collections/useCollectionContent';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CanvasViewer from './CanvasViewer';

const CanvasSelector = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const { canvases } = useCollectionContent(collectionId);
  const [selectedElement, setSelectedElement] = useState<string>(canvases[0]?.canvas.id || '');

  const canvasWithSourceId = canvases[parseInt(selectedElement)];

  return (
    <>
      <Select value={selectedElement} onValueChange={(value) => setSelectedElement(value)}>
        <SelectTrigger className='w-[200px]'>
          <SelectValue placeholder={t('form_placeholder_select_canvas')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{t('label_canvas')}</SelectLabel>
            {canvases.map((elt, index) => (
              <SelectItem key={elt.canvas.id} value={index.toString()}>
                {elt.canvas.id}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {canvasWithSourceId !== undefined && (
        <div className='w-full flex-1'>
          <CanvasViewer canvas={canvasWithSourceId.canvas} sourceId={canvasWithSourceId.sourceId} />
        </div>
      )}
    </>
  );
};

const QuickCanvasViewer = () => {
  const { t } = useTranslation();
  const { collections } = useCollections();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>(
    collections[0]?.id,
  );

  if (collections.length === 0) {
    return <div>{t('info_no_collections_available')}</div>;
  }

  return (
    <div className='flex h-full w-full flex-col items-center space-y-1 p-1'>
      <Select
        value={selectedCollectionId}
        onValueChange={(value) => setSelectedCollectionId(value)}
      >
        <SelectTrigger className='w-[200px]'>
          <SelectValue placeholder={t('form_placeholder_select_collection')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{t('label_collection')}</SelectLabel>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {selectedCollectionId !== undefined && <CanvasSelector collectionId={selectedCollectionId} />}
    </div>
  );
};

export default QuickCanvasViewer;
