import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/utils/config';
import * as pdfjsLib from 'pdfjs-dist';
import { useState } from 'react';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

async function renderPdfToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  console.log('PDF loading task created: ', loadingTask);
  const pdf = await loadingTask.promise;

  const images: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 }); // ↑ changer le scale si nécessaire

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const imgDataUrl = canvas.toDataURL('image/png');
    images.push(imgDataUrl);
  }

  return images;
}

async function uploadImageToSupabase(imageDataUrl: string, fileName: string): Promise<void> {
  const imageFile = await fetch(imageDataUrl).then((res) => res.blob());
  const { data, error } = await supabase.storage.from('corpusense').upload(fileName, imageFile, {
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
      images.forEach((img, i) => {
        void uploadImageToSupabase(img, `avatar${i + 1}.png`);
      });
    };
    void loadPdf();
  };

  return (
    <div className='h-full w-full'>
      <Input type='file' accept='application/pdf' onChange={handleFileChange} />
      <Button onClick={handleLoadPdf}>Upload</Button>
    </div>
  );
};

export default StoragePage;
