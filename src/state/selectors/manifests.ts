import { RootState } from '../store';

/**
 * @returns The content of the loaded manifest (+ metadata) or null if no manifest is loaded
 */
export const selectLoadedManifest = (state: RootState) => state?.manifests.loadedData ?? null;

export const selectIsManifestLoading = (state: RootState) => state?.manifests.isLoading ?? false;

/**
 * @returns The manifest ID of the loaded manifest or an empty string if no manifest is loaded
 */
export const selectManifestURL = (state: RootState) =>
  state?.manifests?.loadedData?.content?.id ?? '';

/**
 * @returns The canvases of the loaded manifest or an empty array if no manifest is loaded
 */
export const selectCanvases = (state: RootState) =>
  state?.manifests?.loadedData?.content?.items ?? [];
