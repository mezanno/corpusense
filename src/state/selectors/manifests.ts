import { RootState } from '../store';

export const getLoadedManifest = (state: RootState) => state?.manifests.loadedData ?? null;

export const getManifestURL = (state: RootState) =>
  state?.manifests?.loadedData?.content?.id ?? null;

export const getHistory = (state: RootState) => state?.manifests?.history ?? [];

export const getCanvases = (state: RootState) => state?.manifests?.loadedData?.content?.items ?? [];
