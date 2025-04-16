import { RootState } from '../store';

/**
 * @returns The content of the loaded manifest (+ metadata) or null if no manifest is loaded
 */
export const getLoadedManifest = (state: RootState) => state?.manifests.loadedData ?? null;

/**
 * @returns The manifest ID of the loaded manifest or an empty string if no manifest is loaded
 */
export const getManifestURL = (state: RootState) => state?.manifests?.loadedData?.content?.id ?? '';

/**
 * @returns The history of loaded manifests or an empty array if no manifest is loaded
 */
export const getHistory = (state: RootState) => state?.manifests?.history ?? [];

/**
 * @returns The canvases of the loaded manifest or an empty array if no manifest is loaded
 */
export const getCanvases = (state: RootState) => state?.manifests?.loadedData?.content?.items ?? [];
