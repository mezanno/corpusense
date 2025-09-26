import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch } from '@/hooks/hooks';
import { importCollectionRequest, importCollectionsRequest } from '@/state/reducers/collections';
import React, { Ref, useState } from 'react';
import { useTranslation } from 'react-i18next';

const UploadFileForm = ({ formRef }: { formRef: Ref<HTMLFormElement | null> }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = (event: React.FormEvent) => {
    event.preventDefault();

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          try {
            const jsonContent = JSON.parse(content) as object;
            dispatch(importCollectionRequest(jsonContent));
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        } else if (content instanceof ArrayBuffer) {
          dispatch(importCollectionsRequest(content));
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
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleImport}
      className='flex flex-col items-center gap-1.5 rounded-2xl border-2 border-gray-200 p-2'
    >
      <Label htmlFor='collectionFile'>{t('form_description_select_collection')}</Label>
      <Input id='collectionFile' type='file' onChange={handleFileChange} />
      {/* {file && <Button onClick={handleImport}>{t('btn_import')}</Button>} */}
    </form>
  );
};

export default UploadFileForm;
