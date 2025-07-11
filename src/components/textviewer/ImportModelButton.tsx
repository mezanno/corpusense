import { useAppDispatch } from '@/hooks/hooks';
import { importModelRequest } from '@/state/reducers/models';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AlertDialogForm from '../AlertDialogForm';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const ImportModelForm = ({ close }: { close: () => void }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className='flex flex-col items-center gap-1.5 rounded-2xl border-2 border-gray-200 p-2'>
      <Label htmlFor='collectionFile'>Fichier</Label>
      <Input id='collectionFile' type='file' onChange={handleFileChange} />
      {file && <Button onClick={handleImport}>{t('btn_import')}</Button>}
      {error !== null && <div className='text-red-500'>{error}</div>}
    </div>
  );
};
const ImportModelButton = () => {
  const { t } = useTranslation();
  return (
    <div>
      <AlertDialogForm
        title={t('btn_import_model')}
        description={t('form_description_import_model')}
        trigger={<Download />}
      >
        {({ close }) => <ImportModelForm close={close} />}
      </AlertDialogForm>
    </div>
  );
};

export default ImportModelButton;
