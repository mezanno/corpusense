import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/utils/config';
import { generateManifest } from '@/utils/manifest';
import { Manifest } from '@iiif/presentation-3';
import { PostgrestError } from '@supabase/supabase-js';
import { Archive } from 'lucide-react';
// import imageBlobReduce from 'image-blob-reduce';
import * as pdfjsLib from 'pdfjs-dist';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

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

//TODO : il est possible de générer les types à partir de supabase : npx supabase gen types typescript --project-id <project-id> > supabase-types.ts
type UserFile = {
  id: string;
  name: string;
  bucket_id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  // Ajoute d'autres champs si tu les exposes depuis la vue
};

const StoragePage = () => {
  const { t } = useTranslation();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const [existingManifests, setExistingManifests] = useState<string[]>([]);

  //TODO: refactor this to use a custom hook
  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        //TODO: handle user authentication and error handling properly
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Erreur utilisateur :', userError);
          return;
        }
        const {
          data: userFiles,
          error,
        }: { data: UserFile[] | null; error: PostgrestError | null } = await supabase
          .from('user_files') //user_files is a view because storage.objects is not accessible directly
          .select()
          .eq('bucket_id', 'corpusense')
          .like('name', '%manifest.json')
          .eq('owner', user.id);
        if (error) {
          console.error('Error fetching storage data:', error);
        } else {
          console.log('Storage data:', userFiles);
        }

        if (userFiles !== null && userFiles.length > 0) {
          const urls = userFiles.map((file) => {
            const { data } = supabase.storage.from('corpusense').getPublicUrl(file.name);
            return data.publicUrl;
          });
          setExistingManifests(urls);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    void fetchStorageData();
  }, []);

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

    const loadPdf = async () => {
      const images = await renderPdfToImages(pdfFile);
      const filename_prefix = pdfFile.name.substring(0, pdfFile.name.length - 4); // Retirer l'extension .pdf
      for (let i = 0; i < images.length; i++) {
        const filename = `${i + 1}`;
        void uploadImageToSupabase(filename_prefix, images[i].data, filename);
        images[i].fullImageUrl =
          `http://localhost:8182/iiif/3/${filename_prefix}_${filename}.png/full/max/0/default.png`;
        images[i].thumbImageUrl =
          `http://localhost:8182/iiif/3/${filename_prefix}_${filename}.png/full/,120/0/default.png`;
      }
      const newManifest = generateManifest(
        images.map((img) => ({
          id: img.fullImageUrl ?? '',
          thumb: img.thumbImageUrl ?? '',
          width: img.width,
          height: img.height,
        })),
        filename_prefix, // Ajouter le préfixe de nom de fichier comme dossier),
      );
      void uploadManifestToSupabase(filename_prefix, newManifest);
      console.log('Generated Manifest: ', newManifest);

      setManifestUrl(newManifest.id);
    };
    void loadPdf();
  };

  return (
    <div className='panel h-full w-full flex-col space-y-2'>
      <h1 className='flex items-center text-2xl font-bold'>
        <Archive className='mr-2' /> {t('page_title_storage')}
      </h1>
      <h2 className='text-lg'>Documents existants</h2>
      <div className='text-sm text-blue-600'>
        {existingManifests.length > 0 ? (
          existingManifests.map((url, index) => (
            <div key={index} className='mb-2'>
              <a href={url}>{url}</a>
            </div>
          ))
        ) : (
          <p>Aucun document trouvé.</p>
        )}
      </div>
      <h2 className='text-lg'>Ajouter un document</h2>
      <Input type='file' accept='application/pdf' onChange={handleFileChange} />
      <Button onClick={handleLoadPdf}>Upload</Button>
      {manifestUrl !== null && (
        <div className='mt-4'>
          <h2> 🥳 T&apos;es un winner ! Ton document est en ligne : {manifestUrl}</h2>
        </div>
      )}
    </div>
  );
};

export default StoragePage;
