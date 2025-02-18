import useManifest from '../hooks/useManifest';
import ManifestInfos from './ManifestInfos';

const ManifestViewer = () => {
  const url = 'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k9002552/manifest.json';

  const { data, error, isLoading } = useManifest(url);
  console.log('data converted: ', data);

  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error.message}</div>
      ) : (
        <div>
          <ManifestInfos manifest={data} />
        </div>
      )}
    </>
  );
};

export default ManifestViewer;
