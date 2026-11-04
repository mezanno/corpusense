import { ManifestSchema } from '@/data/models/source/source';
import { getErrorMessage } from '@/utils/utils';
import { Manifest } from '@iiif/presentation-3';
import { manifestHttpError, RemoteManifestInvalidError } from '../errors';

export const pluginName = 'bnf.fr';

const toOpenApiUrl = (url: string): string =>
  url.replace('gallica.bnf.fr/iiif', 'openapi.bnf.fr/iiif/presentation/v3');

const gallicaImporter = async (url: string): Promise<Manifest> => {
  console.log('gallicaImporter: ', url);
  try {
    return await fetchUrl(toOpenApiUrl(url));
  } catch (error) {
    // Repli sur l'URL d'origine : l'échec de l'API ouverte n'est pas celui du manifeste.
    console.warn(
      `Gallica openapi endpoint failed, falling back to source URL: ${getErrorMessage(error)}`,
    );
    return await fetchUrl(url);
  }
};

const fetchUrl = async (url: string): Promise<Manifest> => {
  const response = await fetch(url, {
    // mode: 'no-cors', //ne sert à rien (renvoie 200 mais corps de la réponse vide)
    headers: {
      Accept: 'application/json',
    },
  });
  if (response.ok) {
    const validation = ManifestSchema.safeParse(await response.json());
    if (!validation.success) {
      throw new RemoteManifestInvalidError({ url });
    }
    return validation.data;
  }
  console.log(`Error fetching manifest: ${response.status} - ${response.statusText}`);
  throw manifestHttpError(url, response);
};

export default gallicaImporter;
