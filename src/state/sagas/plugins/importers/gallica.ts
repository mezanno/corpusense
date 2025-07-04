import i18n from '@/i18n';

export const pluginName = 'bnf.fr';

const gallicaImporter = async (url: string): Promise<object> => {
  console.log('gallicaImporter: ', url);
  const fetchUrl = url.replace('gallica.bnf.fr/iiif', 'openapi.bnf.fr/iiif/presentation/v3');
  const response = await fetch(fetchUrl, {
    // mode: 'no-cors', //ne sert à rien (renvoie 200 mais corps de la réponse vide)
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    if (response.status === 404) {
      console.log(i18n.t('error_404_manifest'));

      throw new Error(i18n.t('error_404_manifest'));
    } else if (response.status === 403) {
      throw new Error(i18n.t('error_403_manifest'));
    } else {
      throw new Error(`Failed to fetch manifest ${response.statusText}`);
    }
  }
  //TODO! gérer cas où ce n'est pas un objet (unknown)
  const data: object = (await response.json()) as object;

  return data;
};

export default gallicaImporter;
