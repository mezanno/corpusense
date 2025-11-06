import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { RootState } from '../store';

const EMPTY_ARRAY: StoredManifestDetails[] = [];

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
 * @returns The history of loaded manifests or an empty array if no manifest is loaded
 */

export const selectHistory = (state: RootState) => state.manifests.historyDetails ?? EMPTY_ARRAY;

/**
 * @returns The canvases of the loaded manifest or an empty array if no manifest is loaded
 */
export const selectCanvases = (state: RootState) =>
  state?.manifests?.loadedData?.content?.items ?? [];
