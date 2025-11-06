import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollectionElement } from '@/data/models/CollectionElement';
import {
  getCollectionRepository,
  getManifestRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useAppSelector } from '@/hooks/hooks';
import { selectCollections } from '@/state/selectors/collections';
import { Canvas } from '@iiif/presentation-3';
import { useEffect, useState } from 'react';
import CanvasViewer from './CanvasViewer';

const QuickCanvasViewer = () => {
  const collections = useAppSelector(selectCollections);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    collections[0]?.id || '',
  );
  const [collectionContent, setCollectionContent] = useState<CollectionElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string>(
    collectionContent[0]?.canvasId || '',
  );
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  console.log('Canvas to display:', canvas);

  useEffect(() => {
    async function fetchCollectionData() {
      const collectionRepository = getCollectionRepository();
      const collectionData = await collectionRepository.getById(selectedCollectionId);
      console.log('Selected Collection Data:', collectionData);
      setCollectionContent(collectionData.content);
    }

    if (selectedCollectionId !== '') {
      void fetchCollectionData();
    }
  }, [selectedCollectionId]);

  useEffect(() => {
    async function fetchCanvasData(elt: CollectionElement) {
      const manifestRepository = getManifestRepository();
      const c = await manifestRepository.getCanvasById(elt.manifestId, elt.canvasId);
      setCanvas(c);
    }
    if (selectedElement !== '') {
      const elt = collectionContent[parseInt(selectedElement, 10)];

      void fetchCanvasData(elt);
    }
  }, [selectedElement]);

  if (collections.length === 0) {
    return <div>No collections available</div>;
  }

  return (
    <div className='flex h-full w-full flex-col items-center space-y-1 p-1'>
      <Select
        value={selectedCollectionId}
        onValueChange={(value) => setSelectedCollectionId(value)}
      >
        <SelectTrigger className='w-[200px]'>
          <SelectValue placeholder='Select a collection' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Collection</SelectLabel>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select value={selectedElement} onValueChange={(value) => setSelectedElement(value)}>
        <SelectTrigger className='w-[200px]'>
          <SelectValue placeholder='Select a canvas' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Canvas</SelectLabel>
            {collectionContent.map((elt, index) => (
              <SelectItem key={index} value={index.toString()}>
                {elt.canvasId}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {canvas && (
        <div className='w-full flex-1'>
          <CanvasViewer canvas={canvas} />
        </div>
      )}
    </div>
  );
};

export default QuickCanvasViewer;
