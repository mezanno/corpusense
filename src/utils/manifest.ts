import { importerPlugins } from '@/App';
import { ConvertedFile } from '@/data/models/convertedFile';
import { getSourceRepository } from '@/data/repositories/indexeddb/dbFactory';
import { convertPresentation2 } from '@iiif/parser/presentation-2';
import { Manifest } from '@iiif/presentation-3';
import i18n from 'i18next';
import { BaseError } from './BaseError';
import { FunctionResult } from './functionResult';
import { getErrorMessage } from './utils';

export class ManifestFetchError extends BaseError {
  constructor(context: { url: string; cause: string }) {
    super(`Manifest with url ${context.url} could not be fetched (cause: ${context.cause})`);
  }
}

export function isManifestUrl(str: string): boolean {
  const regex = /^https?:\/\/[^/\s]+(?:\/\S*)?$/i;
  return regex.test(str);
}

export function containsArkIdentifier(str: string): boolean {
  const regex = /ark:\/\d{5,}\/[a-zA-Z0-9]+/;
  return regex.test(str);
}

export const convertJsonToManifest = (data: object): Manifest => {
  const manifest: Manifest = convertPresentation2(data) as Manifest;

  if (manifest === undefined) {
    throw new Error(i18n.t('error_parse_manifest'));
  }

  return manifest;
};

export type CanvasInfo = {
  id: string;
  thumb: string;
  width: number;
  height: number;
};

export const generateManifest = ({
  documentName,
  canvasInfo,
  folder,
  manifestId,
  isFileSystem = false,
}: {
  documentName: string;
  canvasInfo: CanvasInfo[];
  folder: string;
  manifestId?: string;
  isFileSystem?: boolean;
}): Manifest => {
  const url_from = isFileSystem ? '' : `${import.meta.env.VITE_SUPABASE_STORAGE_URL}/${folder}/`;

  return {
    '@context': 'http://iiif.io/api/presentation/3/context.json',
    id: manifestId ?? `${url_from}/manifest.json`,
    type: 'Manifest',
    label: {
      fr: [documentName],
    },
    items: canvasInfo.map((canvas, index) => ({
      id: `${url_from}/canvas/p${index + 1}`,
      type: 'Canvas',
      label: {
        fr: [`Page ${index + 1}`],
      },
      height: Math.floor(canvas.height),
      width: Math.floor(canvas.width),
      thumbnail: [
        {
          id: canvas.thumb,
          type: 'Image',
          format: 'image/png',
        },
      ],
      items: [
        {
          id: `${url_from}/page/p${index + 1}/1`,
          type: 'AnnotationPage',
          items: [
            {
              id: `${url_from}/annotation/p${index + 1}/1-image`,
              type: 'Annotation',
              motivation: 'painting',
              body: {
                id: canvas.id,
                type: 'Image',
                format: 'image/png',
                width: Math.floor(canvas.width),
                height: Math.floor(canvas.height),
                service: isFileSystem
                  ? []
                  : [
                      {
                        id: canvas.id.substring(0, canvas.id.length - 23), // Retirer l'extension .png
                        type: 'ImageService3',
                        profile: 'level1',
                      },
                    ],
              },
            },
          ],
        },
      ],
    })),
  };
};

/**
 * Side effect to fetch a manifest from a URL. First, it checks if the manifest is already
 * stored in IndexedDB. If it is, it uses the stored manifest. If not, it fetches the manifest
 * from the URL.
 * @param action The action containing the URL of the manifest to fetch.
 */
export async function fetchManifestFromURL(
  url: string,
): Promise<FunctionResult<Manifest, ManifestFetchError>> {
  console.log('handleFetchManifestFromURL ', url);
  const keys = Object.keys(importerPlugins);

  //check if the manifest is already stored in IndexedDB, if so, use the stored manifest
  const sourceRepository = getSourceRepository();
  const contentResult = await sourceRepository.getContentByManifestUrl(url);
  if (contentResult.ok) {
    return FunctionResult.ok(contentResult.value.manifest);
  }

  // If the manifest is not found in IndexedDB, we try to fetch it from the URL
  const importerKey = keys.find((key) => url.includes(key));
  const importer =
    importerKey !== undefined ? importerPlugins[importerKey] : importerPlugins['default'];

  try {
    const manifest = await fetchManifestWithPlugin({
      fetchFunction: () => importer.import(url),
    });
    return FunctionResult.ok(manifest);
  } catch (err) {
    console.error('Error fetching manifest with plugin: ', err);
    const msg = i18n.t('error_loading_manifest', { error: getErrorMessage(err) });
    return FunctionResult.err(new ManifestFetchError({ url, cause: msg }));
  }
}

/**
 * Side effect to fetch a manifest. It can either fetch the manifest from a URL or use
 * a stored manifest. It also fetches the metadata associated with the manifest.
 * @param fetchFunction: A function to fetch the manifest. If not provided, it uses the stored manifest.
 * @param storedManifest: The manifest to use if fetchFunction is not provided.
 */
async function fetchManifestWithPlugin({
  fetchFunction,
  storedManifest,
}: {
  fetchFunction?: () => Promise<object> | object;
  storedManifest?: Manifest;
}) {
  let manifest: Manifest;
  if (fetchFunction) {
    const data = await fetchFunction();
    manifest = convertJsonToManifest(data);
  } else if (storedManifest !== undefined) {
    manifest = storedManifest;
  } else {
    throw new Error(i18n.t('error_no_manifest_method'));
  }

  return manifest;
}
export const reconstructManifestFromConvertedFile = (file: ConvertedFile): Manifest => {
  const baseName = file.manifestName.replace('_manifest.json', '');
  const canvasInfo: CanvasInfo[] = Array.from({ length: file.pageCount }).map((_, index) => {
    const pageNum = index + 1;
    const pageStr = pageNum.toString().padStart(3, '0');
    const filename = `${baseName}_page_${pageStr}.png`;
    const imageId = `${file.folderName}/${filename}`;
    return {
      id: imageId,
      thumb: imageId,
      width: 1000,
      height: 1000,
    };
  });

  return generateManifest({
    documentName: file.title,
    canvasInfo,
    folder: file.folderName,
    manifestId: file.manifestName,
    isFileSystem: true,
  });
};

export const getManifestFromConvertedFile = async (
  file: ConvertedFile,
): Promise<Manifest | null> => {
  const handle = file.outputDirectoryHandle;
  const perm = await handle.queryPermission({ mode: 'read' });
  if (perm !== 'granted') {
    console.error('No permission to read the manifest directory');
    return null;
  }
  const manifestFileHandle = await handle.getFileHandle(file.manifestName);
  const manifestFile = await manifestFileHandle.getFile();
  const manifestText = await manifestFile.text();
  return convertJsonToManifest(JSON.parse(manifestText) as object);
};
