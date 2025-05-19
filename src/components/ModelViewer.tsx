import { DataField, DataModel } from '@/data/models/DataModel';
import { useAppDispatch } from '@/hooks/hooks';
import { saveModelRequest } from '@/state/reducers/models';
import { CirclePlus, CircleX, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analogue } from 'simpler-color';
import { ColorPicker } from './ColorPicker';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const baseColor = '#a4d6f6';

const ModelViewer = ({ model }: { model: DataModel }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const [fields, setFields] = useState(model.fields);

  const handleAddField = () => {
    const nextColor =
      fields.length === 0 ? baseColor : analogue(fields[fields.length - 1].color, 2);
    setFields([...fields, { name: '', type: '', description: '', color: nextColor }]);
  };

  const handleSave = () => {
    const newFields = fields.filter((f) => f.name !== '' && f.type !== '');
    setFields(newFields);
    const updatedModel = { ...model, fields: newFields };
    appDispatch(saveModelRequest(updatedModel));
  };

  const updateFields = (index: number, newValue: Partial<DataField>) => {
    setFields((prev) => {
      const updatedFields = [...prev];
      updatedFields[index] = { ...updatedFields[index], ...newValue };
      return updatedFields;
    });
  };

  return (
    <div className='panel flex w-full flex-col items-center justify-center'>
      <div className='flex items-center space-x-2'>
        <h3 className='text-lg'>
          {t('title_active_model')}
          <span className='font-bold'>{model.name}</span>
        </h3>
        <button title={t('btn_add_datafield')} onClick={handleAddField} className='cursor-pointer'>
          <CirclePlus color='orange' />
        </button>
        <button className='cursor-pointer' title={t('btn_save_model')} onClick={handleSave}>
          <Save color='green' />
        </button>
      </div>
      {fields.length > 0 ? (
        <Table className='w-full'>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table_col_title_name')}</TableHead>
              <TableHead>{t('table_col_title_type')}</TableHead>
              <TableHead>{t('table_col_title_description')}</TableHead>
              <TableHead>{t('table_col_title_color')}</TableHead>
              <TableHead>{t('table_col_title_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={field.name}
                    placeholder={t('form_label_datafield_name')}
                    onChange={(e) => updateFields(index, { name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    key={field.type}
                    value={field.type}
                    onValueChange={(value) => updateFields(index, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={'Type de données'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='string'>Texte</SelectItem>
                      <SelectItem value='number'>Nombre</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={field.description}
                    placeholder={t('form_label_datafield_description')}
                    onChange={(e) => updateFields(index, { description: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <ColorPicker
                    value={field.color}
                    onChange={(v) => updateFields(index, { color: v })}
                  />
                </TableCell>
                <TableCell className='flex justify-center space-x-2'>
                  <button
                    title={t('btn_delete_datafield')}
                    className='cursor-pointer'
                    onClick={() => setFields((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <CircleX />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div>{t('info_empty_model')}</div>
      )}
    </div>
  );
};

export default ModelViewer;
