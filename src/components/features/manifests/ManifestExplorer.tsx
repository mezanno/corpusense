import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { SourceWithContent } from '@/data/models/source/source';
import { Manifest } from '@iiif/presentation-3';
import ListOfManifests from './ListOfManifests';
import ManifestDetails from './ManifestDetails';

const ManifestExplorer = ({
  source,
  manifest,
}: {
  source: SourceWithContent;
  manifest: Manifest;
}) => {
  return (
    <div className='h-full w-full'>
      <ResizablePanelGroup direction='vertical' className='gap-2'>
        <ResizablePanel minSize={33}>
          <ListOfManifests currendManifestId={source.id} />
        </ResizablePanel>
        <ResizableHandle withHandle className='w-1 cursor-col-resize bg-dark-slate-gray' />
        <ResizablePanel minSize={33}>
          <ManifestDetails manifest={manifest} source={source} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ManifestExplorer;
