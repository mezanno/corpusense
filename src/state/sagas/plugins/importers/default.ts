import { ManifestSchema } from '@/data/models/source/source';
import { BaseError } from '@/utils/BaseError';
import { getErrorMessage } from '@/utils/utils';
import { Manifest } from '@iiif/presentation-3';
import { manifestHttpError, ManifestImportError, RemoteManifestInvalidError } from '../errors';

export const pluginName = 'default';

const defaultImporter = async (url: string): Promise<Manifest> => {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw manifestHttpError(url, response);
    }
    const validation = ManifestSchema.safeParse(await response.json());
    if (!validation.success) {
      throw new RemoteManifestInvalidError({ url });
    }
    return validation.data;
  } catch (error) {
    // Le boundary (`utils/manifest.fetchManifestFromURL`) capture et rapporte une seule fois :
    // on relance l'erreur déjà typée au lieu d'en fabriquer une neuve, et on nomme l'URL dans
    // les autres cas plutôt que de conclure à une « erreur inconnue ».
    if (error instanceof BaseError) throw error;
    throw new ManifestImportError({ url, cause: getErrorMessage(error) });
  }
};

export default defaultImporter;
