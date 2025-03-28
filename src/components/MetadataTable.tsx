import { ItemMetadataAttribute } from '@/data/models/Metadata';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { saveMetadaRequest } from '@/state/reducers/manifests';
import { getLoadedManifest } from '@/state/selectors/manifests';
import { CirclePlus, CircleX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const MetadataTable = () => {
  const metadata = useAppSelector(getLoadedManifest)?.metadata;
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [formMetadata, setFormMetadata] = useState<ItemMetadataAttribute[]>(metadata ?? []);

  const handleAddMetadata = () => {
    setFormMetadata([...formMetadata, { label: '', value: '' }]);
  };

  const handleOnSave = () => {
    //delete empty inputs
    const newMetadata = formMetadata.filter((item) => item.label !== '' && item.value !== '');
    setFormMetadata(newMetadata);
    dispatch(saveMetadaRequest(newMetadata));
  };

  const updateMetadata = (index: number, newValue: Partial<ItemMetadataAttribute>) => {
    setFormMetadata((prev) => {
      const updatedMetadata = [...prev];
      updatedMetadata[index] = { ...updatedMetadata[index], ...newValue };
      return updatedMetadata;
    });
  };

  return (
    <div className='w-full flex-col items-center justify-center space-y-2'>
      <Table>
        {/* <TableCaption>Metadata Corpusense</TableCaption> */}
        <TableHeader>
          <TableRow>
            <TableHead>{t('table_col_title_key')}</TableHead>
            <TableHead>{t('table_col_title_value')}</TableHead>
            <TableHead>{t('table_col_title_actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formMetadata?.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <Input
                  value={item.label}
                  placeholder={t('form_placeholder_key')}
                  onChange={(e) => updateMetadata(index, { label: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={item.value}
                  placeholder={t('form_placeholder_value')}
                  onChange={(e) => updateMetadata(index, { value: e.target.value })}
                />
              </TableCell>
              <TableCell className='flex space-x-2'>
                <CircleX
                  onClick={() => setFormMetadata((prev) => prev.filter((_, i) => i !== index))}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div
        onClick={handleAddMetadata}
        className='flex items-center justify-center space-x-2 rounded-xl border-2 p-2'
      >
        <CirclePlus /> <span>{t('btn_add_metadata')}</span>
      </div>
      <Button onClick={handleOnSave}>{t('btn_save')}</Button>
    </div>
  );
};

export default MetadataTable;
