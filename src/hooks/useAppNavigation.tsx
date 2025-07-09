import { useNavigate } from 'react-router-dom';

export const CorpusenseRoutes = {
  MANIFEST: 'manifest',
  COLLECTIONS: 'collections',
  CONFIGURATION: 'configuration',
  MODELS: 'models',
  STORAGE: 'storage',
};

const useAppNavigation = () => {
  const navigate = useNavigate();

  const goToManifestExplorer = async (manifestId?: string) => {
    if (manifestId === undefined) {
      await navigate(`${CorpusenseRoutes.MANIFEST}`);
    } else {
      await navigate(`${CorpusenseRoutes.MANIFEST}?manifestId=${manifestId}`);
    }
  };
  const goToCollectionsManager = async () => {
    await navigate(`/${CorpusenseRoutes.COLLECTIONS}`);
  };
  const goToCollectionInspector = async (collectionId: string) => {
    await navigate(`/${CorpusenseRoutes.COLLECTIONS}/${collectionId}`);
  };
  const goToConfiguration = async () => {
    await navigate(`/${CorpusenseRoutes.CONFIGURATION}`);
  };
  const goToModelsManager = async () => {
    await navigate(`/${CorpusenseRoutes.MODELS}`);
  };
  const goToStorage = async () => {
    await navigate(`/${CorpusenseRoutes.STORAGE}`);
  };

  return {
    goToManifestExplorer,
    goToCollectionsManager,
    goToCollectionInspector,
    goToConfiguration,
    goToModelsManager,
    goToStorage,
  };
};

export default useAppNavigation;
