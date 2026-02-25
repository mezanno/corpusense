import { useNavigate } from 'react-router-dom';

export const CorpusenseRoutes = {
  MANIFEST: 'manifest',
  COLLECTIONS: 'collections',
  CONFIGURATION: 'configuration',
  MODELS: 'models',
  MODIFIERCHAIN: 'modifier-chain',
  LOCAL_SOURCES: 'localSources',
  IIIF_SOURCES: 'iiifSources',
  WORKERS: 'workers',
  DOCUMENTATION: 'doc',
};

type ManifestParams =
  | { manifestId: string; indexeddbId?: never }
  | { indexeddbId: string; manifestId?: never };

const useAppNavigation = () => {
  const navigate = useNavigate();

  const goToManifestExplorer = async (manifest?: ManifestParams) => {
    if (manifest === undefined) {
      await navigate(`/${CorpusenseRoutes.MANIFEST}`);
    } else if (manifest.indexeddbId === undefined) {
      await navigate(`/${CorpusenseRoutes.MANIFEST}?manifestId=${manifest.manifestId}`);
    } else {
      await navigate(`/${CorpusenseRoutes.MANIFEST}?indexeddbId=${manifest.indexeddbId}`);
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
  };
};

export default useAppNavigation;
