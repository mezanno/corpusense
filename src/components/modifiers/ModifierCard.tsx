import { Modifier } from '@/data/models/modifiers/Modifier';
import { Trash } from 'lucide-react';
import z, { ZodObject, ZodRawShape } from 'zod';
import ModifierForm from './ModifierForm';

export type ModifierCardProps<TSchema extends ZodObject<ZodRawShape>> = {
  modifier: Modifier<TSchema>;
  onDelete: (modifierId: string) => void;
  onChange: (modifierId: string, values: z.infer<TSchema>) => void;
};

const ModifierCard = <TSchema extends ZodObject<ZodRawShape>>({
  modifier,
  onDelete,
  onChange,
}: ModifierCardProps<TSchema>) => {
  return (
    <div className='flex max-w-50 flex-col items-end rounded border p-2'>
      <div onClick={() => onDelete(modifier.id)}>
        <Trash size={16} />
      </div>
      <ModifierForm modifier={modifier} onChange={(data) => onChange(modifier.id, data)} />
    </div>
  );
};

export default ModifierCard;
