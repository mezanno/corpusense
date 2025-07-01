import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/utils/config';
import { generateManifest } from '@/utils/manifest';
import { Manifest } from '@iiif/presentation-3';
// import imageBlobReduce from 'image-blob-reduce';
import * as pdfjsLib from 'pdfjs-dist';
import { useState } from 'react';

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

const StoragePage = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  // const [filename, setFilename] = useState<string>('');
  //   useEffect(() => {
  //     const fetchStorageData = async () => {
  //       try {
  //         // const { data, error } = await supabase.storage.listBuckets();
  //         // const { data, error } = await supabase.storage.getBucket('corpusense');
  //         const { data, error } = await supabase.storage.from('corpusense').list();
  //         if (error) {
  //           console.error('Error fetching storage data:', error);
  //         } else {
  //           console.log('Storage data:', data);
  //         }
  //       } catch (err) {
  //         console.error('Unexpected error:', err);
  //       }
  //     };

  //     void fetchStorageData();
  //   }, []);

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
