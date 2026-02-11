import { Modifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import { Trash } from 'lucide-react';
import z, { ZodObject, ZodRawShape } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import ModifierForm from './ModifierForm';

export type ModifierCardProps<TSchema extends ZodObject<ZodRawShape>> = {
  modifier: Modifier<TSchema>;
  onDelete: (modifierId: string) => void;
  onChange: (modifierId: string, values: z.infer<TSchema>) => void;
  onTypeChange: (id: string, newType: string) => void;
};

const ModifierCard = <TSchema extends ZodObject<ZodRawShape>>({
  modifier,
  onDelete,
  onChange,
  onTypeChange,
}: ModifierCardProps<TSchema>) => {
  console.log(modifierRegistry);

  return (
    <div className='flex max-w-50 flex-col items-end rounded border p-2'>
      <div className='flex w-full justify-between'>
        <Select value={modifier.type} onValueChange={(value) => onTypeChange(modifier.id, value)}>
          <SelectTrigger>
            <SelectValue placeholder='modifier' />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(modifierRegistry).map(([key, entry]) => (
              <SelectItem key={key} value={key}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div onClick={() => onDelete(modifier.id)}>
          <Trash size={16} />
        </div>
      </div>

      <ModifierForm modifier={modifier} onChange={(data) => onChange(modifier.id, data)} />
    </div>
  );
};

export default ModifierCard;
