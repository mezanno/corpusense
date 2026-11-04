import i18n from '@/i18n';
import { useFSHandleStore } from '@/state/zustand/useFSHandleStore';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import {
  FilePermissionDeniedError,
  MalformedFilepathError,
  MissingCanvasImageError,
} from './errors';

const getLabel = (canvas: Canvas): string => {
  const label = canvas.label;

  if (!label) {
    return i18n.t('no_label');
  }

  // 1. Si c'est une simple string → on renvoie directement
  if (typeof label === 'string') {
    return label;
  }

  // 2. Si label.none existe et contient au moins un élément → on prend celui-ci
  if (Array.isArray(label.none) && label.none.length > 0) {
    return label.none[0];
  }

  // 3. Sinon, on récupère la *première langue* disponible parmi les clés (ex: en, fr, de ...)
  const [firstLang] = Object.keys(label);
  const values = label[firstLang];

  if (Array.isArray(values) && values.length > 0) {
    return values[0];
  }

  // 4. Fallback
  return i18n.t('no_label');
};

const getImage = (canvas: Canvas): IIIFExternalWebResource => {
  const image = canvas.items?.[0]?.items?.[0].body as IIIFExternalWebResource;
  if (image === undefined) {
    throw new MissingCanvasImageError({ canvasId: canvas.id });
  }
  return image;
};

const getImageForThumbnail = (canvas: Canvas, maxWidth: number = 150): IIIFExternalWebResource => {
  let image = getImage(canvas);

  const regex = /\/full\/\d+,\d+\/0\/[a-z]+\.jpg$/;
  if (image.id !== undefined && !regex.test(image.id)) {
    image = {
      ...image,
      id: image.id.replace(/\/full\/(\d+,|\d+,\d+|full)/, `/full/${maxWidth},`),
    };
  }
  return image;
};

const getFile = async (filepath: string, handle: FileSystemDirectoryHandle) => {
  const pathParts = filepath.split('/');
  if (pathParts.length < 2) {
    throw new MalformedFilepathError({ filepath });
  }
  const folderName = pathParts[0];
  try {
    return await getFileFromHandle(pathParts[1], handle);
  } catch (e) {
    //if there is no converted file, we try to get it from the FSHandle store
    const fsHandleStore = useFSHandleStore.getState();
    const dirHandle = fsHandleStore.getDirectoryHandle(folderName);
    if (dirHandle) {
      return await getFileFromHandle(pathParts[1], dirHandle);
    } else {
      throw e;
    }
  }
};

const getFileFromHandle = async (filename: string, handle: FileSystemDirectoryHandle) => {
  let perm = await handle.queryPermission({ mode: 'read' }); //check if we have permission to read the directory
  if (perm !== 'granted') {
    perm = await handle.requestPermission({ mode: 'read' }); //request permission if we don't have it
  }
  if (perm !== 'granted') {
    throw new FilePermissionDeniedError({ directory: handle.name });
  }
  const fileHandle = await handle.getFileHandle(filename);
  return await fileHandle.getFile();
};

const toGallicaUrl = (iiifUrl: string) => {
  return iiifUrl.replace(
    /https:\/\/openapi\.bnf\.fr\/iiif\/presentation\/v3\/(ark:\/12148\/[^/]+)\/canvas.*/,
    'https://gallica.bnf.fr/$1.item',
  );
};

export { getFile, getImage, getImageForThumbnail, getLabel, toGallicaUrl };
