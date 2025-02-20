import { ManifestState } from '../reducers/manifests';

export const getManifest = (state: ManifestState) => state?.manifests?.data ?? null;

export const getManifestURL = (state: ManifestState) => state?.manifests?.data?.id ?? null;

export const getHistory = (state: ManifestState) => state?.manifests?.history ?? [];
