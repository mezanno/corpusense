import { Modifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import { Handle, Node, NodeProps, Position, useNodeConnections } from '@xyflow/react';
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

const ModifierNode = ({ id, data }: NodeProps<ModifierNodeType>) => {
  const { modifier, onDelete, onChange, onTypeChange, initialValues } = data;
  const connections = useNodeConnections({ id });

  const isSource = connections.some((conn) => conn.source === id);
  const isTarget = connections.some((conn) => conn.target === id);

  return (
    <>
      {isTarget ? (
        <Handle type='target' position={Position.Left}></Handle>
      ) : (
        <Handle
          position={Position.Left}
          type='target'
          onClick={() => data.onInsertBefore(modifier.id)}
          style={{
            background: 'white',
            border: 'none',
            width: 25,
            height: 25,
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            left: -12, // ajuste la position
          }}
        >
          <PlusCircle size={20} />
        </Handle>
      )}
      <div className='flex max-w-50 flex-col items-end space-y-1 p-2 text-left'>
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
      {isSource ? (
        <Handle type='source' position={Position.Right}></Handle>
      ) : (
        <Handle
          position={Position.Right}
          type='source'
          onClick={() => data.onInsertAfter(modifier.id)}
          style={{
            background: 'white',
            border: 'none',
            width: 25,
            height: 25,
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            right: -12, // ajuste la position
          }}
        >
          <PlusCircle size={20} />
        </Handle>
      )}
    </>
  );
};

export default ModifierNode;
