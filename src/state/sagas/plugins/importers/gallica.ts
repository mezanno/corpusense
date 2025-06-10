import i18next from 'i18next';

export const pluginName = 'bnf.fr';

const gallicaImporter = async (url: string): Promise<object> => {
  console.log('gallicaImporter: ', url);
  let fetchUrl = url;
  // if (forceV3) {
  if (url.includes('gallica.bnf.fr')) {
    console.log('Gallica v1 detected');
    const urlV3 = url.replace('gallica.bnf.fr/iiif', 'openapi.bnf.fr/iiif/presentation/v3');
    const responseHead = await fetch(urlV3, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
    if (responseHead.ok) {
      console.info('using Gallica API v3: ', urlV3);
      fetchUrl = urlV3;
    } else {
      console.warn('Gallica API v3 not available, using proxy');

      fetchUrl = `http://localhost:3001/proxy?url=${encodeURIComponent(url)}`;
    }
  }
  // } else {
  //   fetchUrl = `http://localhost:3001/proxy?url=${encodeURIComponent(url)}`;
  // }
  try {
    const response = await fetch(fetchUrl, {
      // mode: 'no-cors', //ne sert à rien (renvoie 200 mais corps de la réponse vide)
      headers: {
        Accept: 'application/json',
        // 'Access-Control-Allow-Origin': '*',
      },
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(i18next.t('error_404_manifest'));
      } else if (response.status === 403) {
        throw new Error(i18next.t('error_403_manifest'));
      } else {
        throw new Error(`Failed to fetch manifest ${response.statusText}`);
      }
    }
    //TODO! gérer cas où ce n'est pas un objet (unknown)
    const data: object = (await response.json()) as object;

    return data;
  } catch (error) {
    throw new Error(i18next.t('error_unknown'));
  }
};

export default gallicaImporter;
