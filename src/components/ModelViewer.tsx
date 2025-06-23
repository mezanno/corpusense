import { DataField } from '@/data/models/DataModel';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { saveModelRequest } from '@/state/reducers/models';
import { getActiveModel } from '@/state/selectors/models';
import { CirclePlus, CircleX, Eye, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analogue } from 'simpler-color';
import { v4 as uuid } from 'uuid';
import AlertDialogForm from './AlertDialogForm';
import { ColorPicker } from './textviewer/ColorPicker';
import ModelPreview from './textviewer/ModelPreview';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
const baseColor = '#a4d6f6';

const ModelViewer = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const model = useAppSelector(getActiveModel);
  const [fields, setFields] = useState(model?.fields ?? []);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (model) {
      setFields(model.fields);
      setDescription(model.description ?? '');
    }
  }, [model]);

  if (model === null) {
    return <div className='panel text-red-500'>{t('error_model_undefined')}</div>;
  }

  const handleAddField = () => {
    const nextColor =
      fields.length === 0 ? baseColor : analogue(fields[fields.length - 1].color, 2);
    setFields([...fields, { id: uuid(), name: '', type: '', description: '', color: nextColor }]);
  };

  const handleSave = () => {
    const newFields = fields.filter((f) => f.name !== '' && f.type !== '');
    setFields(newFields);
    const updatedModel = { ...model, fields: newFields, description: description.trim() };
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
        <button title={t('btn_add_datafield')} onClick={handleAddField} className='soft-button'>
          <CirclePlus color='orange' />
        </button>
        <button className='soft-button' title={t('btn_save_model')} onClick={handleSave}>
          <Save color='green' />
        </button>
        <AlertDialogForm
          title={t('btn_model_preview')}
          description={t('info_preview_model')}
          trigger={<Eye />}
        >
          {({ close }) => <ModelPreview close={close} model={model} />}
        </AlertDialogForm>
      </div>
      <div className='m-2 flex w-full items-center justify-center'>
        <Label htmlFor='description'>{t('form_label_model_description')}</Label>
        <Textarea
          id='description'
          className='ml-2 max-w-3/4 min-w-1/2'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {fields.length > 0 ? (
        <Accordion asChild type='single' collapsible className='w-full' defaultValue='datafields'>
          <AccordionItem value='datafields'>
            <AccordionTrigger>{t('btn_datafields')}</AccordionTrigger>
            <AccordionContent>
              <Table className='w-full'>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table_col_title_name')}</TableHead>
                    <TableHead>{t('table_col_title_type')}</TableHead>
                    <TableHead>{t('table_col_title_description')}</TableHead>
                    <TableHead>{t('table_col_title_ia')}</TableHead>
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
                        <Checkbox
                          checked={field.generated ?? false}
                          onCheckedChange={(checked) =>
                            updateFields(index, { generated: Boolean(checked) })
                          }
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div>{t('info_empty_model')}</div>
      )}
    </div>
  );
};

export default ModelViewer;
