import { DataField, DataModel } from '@/data/models/DataModel';
import { useModelIO } from '@/hooks/data/models/useModelIO';
import { useModels } from '@/hooks/data/models/useModels';
import useDialog from '@/hooks/ui/useDialog';
import { CircleArrowDown, CircleArrowUp, CirclePlus, CircleX, Eye, Save } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { analogue } from 'simpler-color';
import { v4 as uuid } from 'uuid';
import { useAlertDialogContext } from './reducers/useAlertDialogContext';
import { ColorPicker } from './textviewer/ColorPicker';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

const baseColor = '#a4d6f6';

const ModelViewer = ({ modelId }: { modelId: string }) => {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const { openModelPreviewDialog } = useDialog();
  const model = useModels().getModelById(modelId);
  const { saveModel } = useModelIO();
  const [fields, setFields] = useState(model?.fields ?? []);
  const [prompt, setPrompt] = useState('');
  const [modelName, setModelName] = useState(model?.name ?? '');

  const options = [
    { value: 'string', label: t('model_field_string') },
    { value: 'number', label: t('model_field_number') },
  ];

  const onModel = useEffectEvent((dm: DataModel) => {
    setModelName(dm.name);
    setFields(dm.fields);
    setPrompt(dm.prompt ?? '');
  });

  useEffect(() => {
    if (model !== undefined) {
      onModel(model);
    }
  }, [model]);

  if (model === undefined) {
    return <div className='panel text-red-500'>{t('error_model_undefined')}</div>;
  }

  const handleAddField = () => {
    const nextColor =
      fields.length === 0 ? baseColor : analogue(fields[fields.length - 1].color, 2);
    setFields([
      ...fields,
      { id: uuid(), name: '', type: options[0].value, description: '', color: nextColor },
    ]);
  };

  const handleSave = () => {
    void (async () => {
      const newFields = fields.filter((f) => f.name !== '' && f.type !== '');
      setFields(newFields);
      const updatedModel = {
        ...model,
        name: modelName.trim() || model.name,
        fields: newFields,
        prompt: prompt.trim(),
      };
      await saveModel(updatedModel);
    })();
  };

  const updateFields = (index: number, newValue: Partial<DataField>) => {
    setFields((prev) => {
      const updatedFields = [...prev];
      updatedFields[index] = { ...updatedFields[index], ...newValue };
      return updatedFields;
    });
  };

  const handleSwapFields = (index: number, direction: 'up' | 'down') => {
    setFields((prev) => {
      const updatedFields = [...prev];
      if (direction === 'up' && index > 0) {
        [updatedFields[index - 1], updatedFields[index]] = [
          updatedFields[index],
          updatedFields[index - 1],
        ];
      } else if (direction === 'down' && index < updatedFields.length - 1) {
        [updatedFields[index + 1], updatedFields[index]] = [
          updatedFields[index],
          updatedFields[index + 1],
        ];
      }
      return updatedFields;
    });
  };

  const handleDeleteField = (index: number) => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_datafield'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => {
          setFields((prev) => prev.filter((_, i) => i !== index));
        },
      },
    });
  };

  return (
    <div className='flex h-full w-full flex-col items-center'>
      <div className='flex items-center space-x-2'>
        <h3 className='text-lg'>
          {t('title_active_model')}
          <input
            type='text'
            className='font-bold'
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
        </h3>
        <button title={t('btn_add_datafield')} onClick={handleAddField} className='soft-button'>
          <CirclePlus color='orange' />
        </button>
        <button className='soft-button' title={t('btn_save_model')} onClick={handleSave}>
          <Save color='green' />
        </button>
        <button
          className='soft-button'
          onClick={() => openModelPreviewDialog(model)}
          title={t('btn_model_preview')}
        >
          <Eye />
        </button>
      </div>

      <div className='mt-2 flex w-full justify-center'>
        <div className='flex w-2/3 flex-col justify-center gap-2'>
          <Label htmlFor='prompt'>{t('form_label_model_prompt')}</Label>
          <Textarea
            id='prompt'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className='min-h-40'
          />
        </div>
      </div>

      <div className='mt-2 flex h-full w-full'>
        {fields.length > 0 ? (
          <AutoSizer>
            {({ height, width }) => (
              <ScrollArea style={{ height, width }}>
                <Table className='border'>
                  <TableHeader className='bg-white/30'>
                    <TableRow>
                      <TableHead className='w-2/12'>{t('table_col_title_name')}</TableHead>
                      <TableHead className='w-1/12'>{t('table_col_title_type')}</TableHead>
                      <TableHead className='w-1/12'>{t('table_col_title_isArray')}</TableHead>
                      <TableHead className='w-1/12'>{t('table_col_title_ia')}</TableHead>
                      <TableHead className='w-5/12'>{t('table_col_title_description')}</TableHead>
                      <TableHead className='w-1/12'>{t('table_col_title_color')}</TableHead>
                      <TableHead className='w-1/12'>{t('table_col_title_actions')}</TableHead>
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
                              {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={field.isArray ?? false}
                            onCheckedChange={(checked) =>
                              updateFields(index, { isArray: Boolean(checked) })
                            }
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
                          <Textarea
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
                        <TableCell>
                          <div className='flex space-x-1'>
                            {index > 0 && (
                              <button
                                className='cursor-pointer'
                                title={t('btn_moveup_datafield')}
                                onClick={() => handleSwapFields(index, 'up')}
                              >
                                <CircleArrowUp />
                              </button>
                            )}
                            {index < fields.length - 1 && (
                              <button
                                className='cursor-pointer'
                                title={t('btn_movedown_datafield')}
                                onClick={() => handleSwapFields(index, 'down')}
                              >
                                <CircleArrowDown />
                              </button>
                            )}
                            <button
                              title={t('btn_delete_datafield')}
                              className='cursor-pointer'
                              onClick={() => handleDeleteField(index)}
                            >
                              <CircleX />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </AutoSizer>
        ) : (
          <div>{t('info_empty_model')}</div>
        )}
      </div>
    </div>
  );
};

export default ModelViewer;
