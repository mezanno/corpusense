import { IIIFResource } from 'manifesto.js';

const ManifestInfos = ({ manifest }: { manifest: IIIFResource }) => {
  const thumbnail = manifest.getThumbnail();

  const canvases = manifest.getSequences()[0].getCanvases();
  console.log(canvases);

  return (
    <div className='flex flex-col'>
      <div className='text-lg font-bold'>{manifest.id}</div>
      <div>
        <img src={thumbnail.id} alt='thumbnail' />
      </div>
    </div>
  );
};

export default ManifestInfos;
