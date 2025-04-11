import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch } from '@/hooks/hooks';
import { importMultipleCollections, importOneCollection } from '@/state/reducers/collections';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const UploadFileForm = ({ close }: { close: () => void }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          try {
            const jsonContent = JSON.parse(content) as object;
            dispatch(importOneCollection(jsonContent));
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        } else if (content instanceof ArrayBuffer) {
          dispatch(importMultipleCollections(content));
        } else {
          console.error('Unsupported file type');
        }
      };
      if (file.name.endsWith('.zip')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }
    close();
  };

  return (
    <div className='flex flex-col items-center gap-1.5 rounded-2xl border-2 border-gray-200 p-2'>
      <Label htmlFor='collectionFile'>Fichier</Label>
      <Input id='collectionFile' type='file' onChange={handleFileChange} />
      {file && <Button onClick={handleImport}>{t('btn_import')}</Button>}
    </div>
  );
};

export default UploadFileForm;
