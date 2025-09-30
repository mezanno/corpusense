import i18n from 'i18next';

export const pluginName = 'bnf.fr';

const gallicaImporter = async (url: string): Promise<object> => {
  console.log('gallicaImporter: ', url);
  try {
    const urlV3 = url.replace('gallica.bnf.fr/iiif', 'openapi.bnf.fr/iiif/presentation/v3');
    return await fetchUrl(urlV3);
  } catch (error) {
    // try {
    return await fetchUrl(url);
    // } catch (err) {
    // throw err;
    // }
  }

  // if (!response.ok) {
  //   if (response.status === 404) {
  //     console.log(i18n.t('error_404_manifest'));

  //     throw new Error(i18n.t('error_404_manifest'));
  //   } else if (response.status === 403) {
  //     throw new Error(i18n.t('error_403_manifest'));
  //   } else {
  //     throw new Error(`Failed to fetch manifest ${response.statusText}`);
  //   }
};

const fetchUrl = async (url: string): Promise<object> => {
  const response = await fetch(url, {
    // mode: 'no-cors', //ne sert à rien (renvoie 200 mais corps de la réponse vide)
    headers: {
      Accept: 'application/json',
    },
  });
  if (response.ok) {
    //TODO! gérer cas où ce n'est pas un objet (unknown)
    return (await response.json()) as object;
  }
  console.log(`Error fetching manifest: ${response.status} - ${response.statusText}`);
  if (response.status === 404) {
    throw new Error(i18n.t('error_404_manifest', { url }));
  } else if (response.status === 403) {
    throw new Error(i18n.t('error_403_manifest', { url }));
  } else {
    throw new Error(
      i18n.t('error_loading_manifest', { error: `${response.status} ${response.statusText}` }),
    );
  }
};

export default gallicaImporter;
