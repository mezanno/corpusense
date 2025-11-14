import { useAppDispatch } from '@/hooks/hooks';
import { useFs } from '@/hooks/useFs';
import useLocalManifest from '@/hooks/useLocalManifest';
import usePdfWorker from '@/hooks/usePdfWorker';
import { fecthManifestRequest } from '@/state/reducers/manifests';
import { generateManifest } from '@/utils/manifest';
import { ImageData } from '@/workers/pdfWorker';
import { File, FileWarning, Folder, FolderX, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PdfProgress from './pdfProgress/PdfProgress';
import { pdfProgressStore } from './pdfProgress/progressStore';
import { Item, ItemContent, ItemMedia } from './ui/item';

const base64ToBlob = (base64: string, mime = 'application/pdf') => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
};

const LocalManifestBrowser = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const { processPdf } = usePdfWorker();
  const { setHandles } = useLocalManifest();
  const [imagesData, setImagesData] = useState<ImageData[]>([]);

  const { onDirectorySelection, files, isBrowserSupported, writeFile, handles } = useFs({});

  const handleGenerateManifest = async (path: string) => {
    const fileContent = files.get(path);
    if (fileContent === undefined) return;

    const blob = base64ToBlob(fileContent);

    const images = await processPdf(blob, (progress) => {
      pdfProgressStore.set(progress.percent);
    });
    setImagesData(images);
  };

  const handleSaveManifest = async (path: string) => {
    for (let i = 0; i < imagesData.length; i++) {
      const image = imagesData[i];
      const url = `${path}_page_${i + 1}.png`;
      await writeFile(url, image.data.slice().buffer);
      imagesData[i].fullImageUrl = url;
      imagesData[i].thumbImageUrl = url;
    }
    const newManifest = generateManifest(
      `${path}_manifest.json`,
      imagesData.map((img) => ({
        id: img.fullImageUrl ?? '',
        thumb: img.thumbImageUrl ?? '',
        width: img.width,
        height: img.height,
      })),
      path,
      '',
    );
    await writeFile(`${path}_manifest.json`, JSON.stringify(newManifest, null, 2));
  };

  const handleOpenManifest = (path: string) => {
    const manifestText = files.get(path);
    if (manifestText === undefined) return;

    setHandles(handles);
    appDispatch(fecthManifestRequest(manifestText));
  };

  if (!isBrowserSupported) {
    return (
      <Item variant='outline' size='sm' className='flex'>
        <ItemMedia>
          <FileWarning size={24} />
        </ItemMedia>
        <ItemContent>{t('error_fs_access_not_supported')}</ItemContent>
      </Item>
    );
  }

  const hasManifest = Array.from(files.keys()).some((path) =>
    path.toLocaleLowerCase().endsWith('.json'),
  );

  const hasPdf = Array.from(files.keys()).some((path) => path.toLocaleLowerCase().endsWith('.pdf'));

  return (
    <div className='flex flex-col space-y-1'>
      <div className='flex items-center justify-between space-x-2'>
        <div>
          <h3 className='font-semibold'>{t('title_use_local_manifest')}</h3>
          <p className='text-sm font-light'>{t('description_local_manifest')}</p>
        </div>
        <div>
          <button
            className='soft-button'
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={onDirectorySelection}
          >
            <Folder />
            {t('btn_select_folder')}
          </button>
        </div>
      </div>
      {files.size > 0 ? (
        hasManifest ? (
          <>
            <div>Manifest trouvé :</div>
            {Array.from(files.keys())
              .filter((path) => path.toLocaleLowerCase().endsWith('.json'))
              .map((path) => (
                <div
                  key={path}
                  className='flex cursor-pointer items-center gap-2'
                  onClick={() => void handleOpenManifest(path)}
                >
                  <File />
                  <span>{path}</span>
                </div>
              ))}
          </>
        ) : hasPdf ? (
          <div>
            <h4>{t('title_pdf_in_folder')}</h4>
            {Array.from(files.keys())
              .filter((path) => path.toLocaleLowerCase().endsWith('.pdf'))
              .map((path) => (
                <div key={path} className='flex items-center gap-2'>
                  <File
                    onClick={() => void handleGenerateManifest(path)}
                    className='cursor-pointer'
                  />
                  <span>{path}</span>
                  <PdfProgress />
                  {imagesData.length > 0 && (
                    <button className='soft-button' onClick={() => void handleSaveManifest(path)}>
                      <Save size={12} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div>Aucun pdf ni manifest</div>
        )
      ) : (
        <div className='flex text-red-500'>
          <FolderX /> {t('info_empty_folder')}
        </div>
      )}
    </div>
  );
};

export default LocalManifestBrowser;
