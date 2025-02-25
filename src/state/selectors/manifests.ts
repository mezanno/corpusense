import { RootState } from '../store';

export const getManifest = (state: RootState) => state?.manifests ?? null;

export const getManifestURL = (state: RootState) => state?.manifests?.data?.id ?? null;

export const getHistory = (state: RootState) => state?.manifests?.history ?? [];
