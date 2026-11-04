import { useNavigate } from 'react-router-dom';

export const CorpusenseRoutes = {
  MANIFEST: 'manifest',
  PROJECT: 'project',
  COLLECTIONS: 'collections',
  CONFIGURATION: 'configuration',
  MODELS: 'models',
  MODIFIERCHAIN: 'modifier-chain',
  LOCAL_SOURCES: 'localSources',
  IIIF_SOURCES: 'iiifSources',
  WORKERS: 'workers',
  DOCUMENTATION: 'doc',
  EXPERT: 'expert',
};

const useAppNavigation = () => {
  const navigate = useNavigate();

  const goToManifestExplorer = async (sourceId?: string) => {
    if (sourceId === undefined) {
      await navigate(`/${CorpusenseRoutes.MANIFEST}`);
    } else {
      await navigate(`/${CorpusenseRoutes.MANIFEST}?manifestId=${sourceId}`);
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
  const goToModifierChainManager = async () => {
    await navigate(`/${CorpusenseRoutes.MODIFIERCHAIN}`);
  };
  const goToLocalSources = async () => {
    await navigate(`/${CorpusenseRoutes.LOCAL_SOURCES}`);
  };
  const goToWorkersManager = async () => {
    await navigate(`/${CorpusenseRoutes.WORKERS}`);
  };
  const goToDocumentation = async () => {
    await navigate(`/${CorpusenseRoutes.DOCUMENTATION}`);
  };
  const goToProjectPage = async () => {
    await navigate(`/${CorpusenseRoutes.PROJECT}`);
  };
  const goToExpertPage = async () => {
    await navigate(`/${CorpusenseRoutes.EXPERT}`);
  };

  return {
    goToManifestExplorer,
    goToCollectionsManager,
    goToCollectionInspector,
    goToConfiguration,
    goToModelsManager,
    goToModifierChainManager,
    goToLocalSources,
    goToWorkersManager,
    goToDocumentation,
    goToProjectPage,
    goToExpertPage,
  };
};

export default useAppNavigation;
