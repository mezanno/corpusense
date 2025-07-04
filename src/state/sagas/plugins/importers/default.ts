import i18next from 'i18next';

export const pluginName = 'default';

const defaultImporter = async (url: string): Promise<object> => {
  console.log('defaultImporter: ', url);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
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

export default defaultImporter;
