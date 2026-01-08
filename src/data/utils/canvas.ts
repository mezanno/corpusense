import { getConvertedFileRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useFSHandleStore } from '@/state/zustand/useFSHandleStore';
import { Canvas, IIIFExternalWebResource, ImageService } from '@iiif/presentation-3';
import i18next from 'i18next';
import { TileSource } from 'openseadragon';

const getLabel = (canvas: Canvas): string => {
  const label = canvas.label;

  if (!label) {
    return i18next.t('no_label');
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
  return i18next.t('no_label');
};

const getImage = (canvas: Canvas): IIIFExternalWebResource => {
  const image = canvas.items?.[0]?.items?.[0].body as IIIFExternalWebResource;
  if (image === undefined) {
    throw new Error(i18next.t('error_image_not_found'));
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

const getFile = async (filepath: string) => {
  const pathParts = filepath.split('/');
  if (pathParts.length < 2) {
    throw new Error(i18next.t('error_malformed_filepath', { path: filepath }));
  }
  const convertedFilesRepository = getConvertedFileRepository();
  const folderName = pathParts[0];
  try {
    const convertedFile = await convertedFilesRepository.getByFolderName(folderName);
    const handle = convertedFile.outputDirectoryHandle;
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
  const perm = await handle.queryPermission({ mode: 'read' });
  if (perm !== 'granted') {
    throw new Error('No permission to read the manifest directory');
  }
  const fileHandle = await handle.getFileHandle(filename);
  return await fileHandle.getFile();
};

const getObjectUrl = async (filepath: string) => {
  return URL.createObjectURL(await getFile(filepath));
};

const getSource = async (canvas: Canvas): Promise<TileSource[]> => {
  const image = getImage(canvas);

  let source: TileSource[] = [];
  if (image?.service?.length != null && image.service.length > 0) {
    const service = image.service[0] as ImageService;
    if (service !== undefined) {
      const id = service['@id'] ?? service.id;
      if (id !== undefined) {
        source = [`${id}/info.json`] as unknown as TileSource[];
      }
    }
  } else {
    if (image?.id !== undefined && !image.id.startsWith('http')) {
      const url = await getObjectUrl(image.id);
      source = [{ type: 'image', url: url }] as unknown as TileSource[];
    } else {
      source = [{ type: 'image', url: image.id }] as unknown as TileSource[];
    }
  }

  return source;
};

const toGallicaUrl = (iiifUrl: string) => {
  return iiifUrl.replace(
    /https:\/\/openapi\.bnf\.fr\/iiif\/presentation\/v3\/(ark:\/12148\/[^/]+\/[^/]+)\/canvas/,
    'https://gallica.bnf.fr/$1.item',
  );
};

const imageToBase64 = async (image: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result); // data:image/...;base64,...
      } else {
        reject(new Error('Conversion en base64 échouée'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(image);
  });
};

export {
  getFile,
  getImage,
  getImageForThumbnail,
  getLabel,
  getObjectUrl,
  getSource,
  imageToBase64,
  toGallicaUrl,
};
