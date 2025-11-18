import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/utils/config';
import { generateManifest } from '@/utils/manifest';
import { Manifest } from '@iiif/presentation-3';
import { Archive, Trash } from 'lucide-react';
// import imageBlobReduce from 'image-blob-reduce';
import { getImage } from '@/data/utils/canvas';
import { useAppSelector } from '@/hooks/hooks';
import { useUserManifests } from '@/hooks/useUserManifests';
import { selectAuthStatus } from '@/state/selectors/auth';
import * as pdfjsLib from 'pdfjs-dist';
import { useState } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import { useTranslation } from 'react-i18next';
import { SyncLoader } from 'react-spinners';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const CANTALOUPE_URL = import.meta.env.VITE_CANTALOUPE_URL as string;

// const reduceBlob = imageBlobReduce();

type ImageData = {
  data: string;
  width: number;
  height: number;
  fullImageUrl?: string;
  thumbImageUrl?: string;
};

async function renderPdfToImages(file: File): Promise<ImageData[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const images: ImageData[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 }); // ↑ changer le scale si nécessaire

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const imgDataUrl = canvas.toDataURL('image/png');
    images.push({ data: imgDataUrl, width: viewport.width, height: viewport.height });
  }

  return images;
}

async function uploadImageToSupabase(
  folder: string,
  imageDataUrl: string,
  fileName: string,
): Promise<void> {
  const imageFile = await fetch(imageDataUrl).then((res) => res.blob());
  const { data: fullImageData, error: fullImageError } = await supabase.storage
    .from('corpusense')
    .upload(`${folder}_${fileName}.png`, imageFile, {
      cacheControl: '3600',
      upsert: false,
    });
  if (fullImageError) {
    console.error('Erreur upload :', fullImageError.message);
  } else {
    console.log('Fichier uploadé :', fullImageData);
  }

  // const thumb = await reduceBlob.toBlob(imageFile, {
  //   max: 200,
  // });
  // const { data: thumbImageData, error: thumbImageError } = await supabase.storage
  //   .from('corpusense')
  //   .upload(`${fileName}_thumb.png`, thumb, {
  //     cacheControl: '3600',
  //     upsert: false,
  //   });
  // if (thumbImageError) {
  //   console.error('Erreur upload :', thumbImageError.message);
  // } else {
  //   console.log('Fichier uploadé :', thumbImageData);
  // }
}

async function uploadManifestToSupabase(folder: string, manifest: Manifest) {
  const jsonBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });

  const { data, error } = await supabase.storage
    .from('corpusense')
    .upload(`${folder}/manifest.json`, jsonBlob, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) {
    console.error('Erreur upload :', error.message);
  } else {
    console.log('Fichier uploadé :', data);
  }
}

const StoragePage = () => {
  const { t } = useTranslation();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const { existingManifests, loading, error } = useUserManifests();
  const [uploading, setUploading] = useState(false);
  const isConnected = useAppSelector(selectAuthStatus) === 'authenticated';

  if (!isConnected) {
    return (
      <div className='panel h-full w-full flex-col space-y-2'>
        <h1 className='flex items-center text-2xl font-bold'>
          <Archive className='mr-2' /> {t('page_title_storage')}
        </h1>
        <p>{t('info_not_connected_description')}</p>
      </div>
    );
  }

  const hrefPath = `${window.location.origin}${import.meta.env.VITE_BASE_PATH ?? ''}/manifest?manifestId=`;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleLoadPdf = () => {
    if (!pdfFile) {
      alert('Veuillez sélectionner un fichier PDF.');
      return;
    }

    if (documentName.trim() === '') {
      alert('Veuillez entrer un nom pour le document.');
      return;
    }

    const loadPdf = async () => {
      const images = await renderPdfToImages(pdfFile);
      for (let i = 0; i < images.length; i++) {
        const filename = `${i + 1}`;
        void uploadImageToSupabase(documentName, images[i].data, filename);
        images[i].fullImageUrl =
          `${CANTALOUPE_URL}${documentName}_${filename}.png/full/max/0/default.png`;
        images[i].thumbImageUrl =
          `${CANTALOUPE_URL}${documentName}_${filename}.png/full/,120/0/default.png`;
      }
      const newManifest = generateManifest({
        documentName: documentName.trim(),
        canvasInfo: images.map((img) => ({
          id: img.fullImageUrl ?? '',
          thumb: img.thumbImageUrl ?? '',
          width: img.width,
          height: img.height,
        })),
        folder: documentName, // Ajouter le préfixe de nom de fichier comme dossier),
      });
      void uploadManifestToSupabase(documentName, newManifest);
      console.log('Generated Manifest: ', newManifest);

      setManifestUrl(newManifest.id);
    };
    setUploading(true);
    void loadPdf();
    setUploading(false);
  };

  const handleDelete = (url: string) => {
    async function deleteManifest() {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Erreur lors de la récupération du manifeste :', response.statusText);
        return;
      }
      try {
        const manifest: Manifest = (await response.json()) as Manifest;
        const canvasList = manifest.items;
        const filenames: string[] = [];
        for (const canvas of canvasList) {
          const imageService = getImage(canvas).service?.[0];
          if (imageService && 'id' in imageService) {
            const imageName = imageService.id?.toString().split('/').pop();
            if (imageName !== undefined) {
              filenames.push(imageName);
            }
          }
        }
        if (filenames.length > 0) {
          const { data, error: removeError } = await supabase.storage
            .from('corpusense')
            .remove(filenames);
          if (removeError) {
            console.warn(removeError);
          }
          console.log('Fichiers supprimés :', data);
        }
      } catch (err) {
        console.error('Erreur lors de la conversion en manifeste :', err);
      }
    }

    void deleteManifest();
  };

  return (
    <div className='panel h-full w-full flex-col space-y-2'>
      <h1 className='flex items-center text-2xl font-bold'>
        <Archive className='mr-2' /> {t('page_title_storage')}
      </h1>
      <h2 className='text-lg'>Documents existants</h2>
      <div>
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p>Erreur lors du chargement.</p>
        ) : existingManifests.length > 0 ? (
          existingManifests.map((url, index) => (
            <div key={index} className='mb-2 flex items-center space-x-2'>
              <a href={`${hrefPath}${url}`} className='text-blue-600 underline'>
                {hrefPath}
                {url}
              </a>
              <div className='soft-button bg-red-400 text-white' onClick={() => handleDelete(url)}>
                <Trash size={16} />
              </div>
            </div>
          ))
        ) : (
          <p>Aucun document trouvé.</p>
        )}
      </div>
      <div className='flex flex-col items-center border p-2'>
        <h2 className='text-lg'>Ajouter un document</h2>
        <form className='flex w-1/2 flex-col space-y-2'>
          <Input
            type='text'
            required
            placeholder={t('form_placeholder_document_name')}
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
          />
          <Input type='file' accept='application/pdf' onChange={handleFileChange} />
          {!uploading ? (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLoadPdf();
              }}
              className='w-auto self-center'
            >
              Upload
            </Button>
          ) : (
            <SyncLoader />
          )}
          {manifestUrl !== null && (
            <div className='mt-4'>
              <h2> 🥳 T&apos;es un winner ! Ton document est en ligne : {manifestUrl}</h2>
              <Fireworks autorun={{ speed: 2, duration: 4 }} />
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default StoragePage;
