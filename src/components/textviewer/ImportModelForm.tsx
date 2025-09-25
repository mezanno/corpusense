import { useAppDispatch } from '@/hooks/hooks';
import { importModelRequest } from '@/state/reducers/models';
import { Ref, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const ImportModelForm = ({ formRef }: { formRef: Ref<HTMLFormElement | null> }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            appDispatch(importModelRequest(jsonContent));
            console.log(jsonContent);
            close();
          } catch (err) {
            console.error('Error parsing JSON:', err);
          }
        } else {
          setError(t('error_unsupported_file_type'));
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
      <Label htmlFor='collectionFile'>Fichier</Label>
      <Input id='collectionFile' type='file' onChange={handleFileChange} />
      {error !== null && <div className='text-red-500'>{error}</div>}
    </form>
  );
};

export default ImportModelForm;
