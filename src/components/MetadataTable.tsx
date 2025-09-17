import { ItemMetadataAttribute } from '@/data/models/Metadata';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { saveMetadataRequest } from '@/state/reducers/manifests';
import { selectLoadedManifest } from '@/state/selectors/manifests';
import { CirclePlus, CircleX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const MetadataTable = ({ manifestId }: { manifestId: string }) => {
  const metadata = useAppSelector(selectLoadedManifest)?.metadata;
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
    dispatch(saveMetadataRequest({ manifestId, metadata: newMetadata }));
  };

  const updateMetadata = (index: number, newValue: Partial<ItemMetadataAttribute>) => {
    setFormMetadata((prev) => {
      const updatedMetadata = [...prev];
      updatedMetadata[index] = { ...updatedMetadata[index], ...newValue };
      return updatedMetadata;
    });
  };

  return (
    <div className='flex w-full flex-col items-center justify-center space-y-2'>
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
              <TableCell className='flex justify-center space-x-2'>
                <button
                  title={t('btn_delete_metadata')}
                  className='cursor-pointer'
                  onClick={() => setFormMetadata((prev) => prev.filter((_, i) => i !== index))}
                >
                  <CircleX />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <button title={t('btn_add_metadata')} onClick={handleAddMetadata} className='soft-button'>
        <CirclePlus />
        <span>{t('btn_add_metadata')}</span>
      </button>
      <button onClick={handleOnSave} title={t('btn_save')} className='soft-button'>
        {t('btn_save')}
      </button>
    </div>
  );
};

export default MetadataTable;
