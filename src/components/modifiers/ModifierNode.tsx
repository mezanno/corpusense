import { Modifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { PlusCircle, Trash } from 'lucide-react';
import z, { ZodObject, ZodRawShape } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import ModifierForm from './ModifierForm';

export type ModifierNodeProps<TSchema extends ZodObject<ZodRawShape>> = {
  modifier: Modifier<TSchema>;
  initialValues: z.infer<TSchema>;
  onDelete: (modifierId: string) => void;
  onInsertAfter: (modifierId: string) => void;
  onInsertBefore: (modifierId: string) => void;
  onChange: (modifierId: string, values: z.infer<TSchema>) => void;
  onTypeChange: (id: string, newType: string) => void;
};

type ModifierNodeType = Node<ModifierNodeProps<ZodObject<ZodRawShape>>>;

const ModifierNode = ({ data }: NodeProps<ModifierNodeType>) => {
  const { modifier, onDelete, onChange, onTypeChange, initialValues } = data;

  return (
    <>
      <Handle
        position={Position.Left}
        type='target'
        style={{
          background: 'none',
          border: 'none',
          width: '1em',
          height: '1em',
        }}
        onClick={() => data.onInsertBefore(modifier.id)}
      >
        <div
          className='absolute -left-3 rounded-2xl bg-white'
          style={{
            pointerEvents: 'none',
          }}
        >
          <PlusCircle size={25} />
        </div>
      </Handle>
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

        <ModifierForm
          modifier={modifier}
          onChange={(formData) => onChange(modifier.id, formData)}
          initialValues={initialValues}
        />
      </div>
      <Handle
        position={Position.Right}
        type='source'
        style={{
          background: 'none',
          border: 'none',
          width: '1em',
          height: '1em',
        }}
        onClick={() => data.onInsertAfter(modifier.id)}
      >
        <div
          className='absolute left-1 rounded-2xl bg-white'
          style={{
            pointerEvents: 'none',
          }}
        >
          <PlusCircle size={25} />
        </div>
      </Handle>
    </>
  );
};

export default ModifierNode;
