export const fetchJson = async (url: string): Promise<object> => {
  console.log('fetchJson: ', url);
  let fetchUrl = url;
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
  const response = await fetch(fetchUrl, {
    // mode: 'no-cors', //ne sert à rien (renvoie 200 mais corps de la réponse vide)
    headers: {
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
  if (!response.ok) {
    console.log(response);

    throw new Error(`Failed to fetch manifest ${response.statusText}`);
  }
  //TODO! gérer cas où ce n'est pas un objet (unknown)
  const data: object = (await response.json()) as object;

  return data;
};
