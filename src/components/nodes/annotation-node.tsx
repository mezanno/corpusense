import { Annotation, ElementType, getBodies } from '@/data/models/Annotation';
import { useAppDispatch } from '@/hooks/hooks';
import { Node, NodeProps, Position } from '@xyflow/react';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseHandle } from '../base-handle';
import {
  NodeHeader,
  NodeHeaderActions,
  NodeHeaderMenuAction,
  NodeHeaderTitle,
} from '../node-header';
import { DropdownMenuItem } from '../ui/dropdown-menu';

export type AnnotationNode = Node<{
  annotation: Annotation;
  hovered: boolean;
  setHoveredElement: (id: string | null) => void;
}>;

export function AnnotationNode({ id, data }: NodeProps<AnnotationNode>) {
  const { value, type } = useMemo(() => getBodies(data.annotation), [data.annotation]);

  const [localValue, setLocalValue] = useState(value); //permet de mettre à jour l'input sans attendre la réponse du saga

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const dispatch = useAppDispatch();

  const handleMouseEnter = useCallback(
    () => data.setHoveredElement(id),
    [id, data.setHoveredElement],
  );
  const handleMouseLeave = useCallback(
    () => data.setHoveredElement(null),
    [data.setHoveredElement],
  );

  const classes = useMemo(() => {
    let result = '';
    if (type === ElementType.ENTRY) {
      result += 'bg-red-100';
    } else {
      result += 'bg-green-100';
    }
    if (data.hovered) {
      result += ' border-2';
      if (type === ElementType.ENTRY) {
        result += ' border-red-500';
      } else {
        result += ' border-green-500';
      }
    }
    return result;
  }, [data.hovered, type]);

  const dispatchValue = useCallback(
    (_newValue: string) => {
      // dispatch(updateAnnotationValueRequest({ id, value: newValue }));
    },
    [dispatch],
  );

  const debouncedDispatch = useMemo(() => debounce(dispatchValue, 1000), [dispatchValue]);

  useEffect(() => {
    return () => {
      debouncedDispatch.cancel();
    };
  }, [debouncedDispatch]);

  const handleOnChangeValue = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedDispatch(e.target.value);
    setLocalValue(e.target.value);
  }, []);

  return (
    <div
      className={`${classes} `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        maxWidth: '200px',
        maxHeight: '200px',
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        WebkitLineClamp: 5, // Limite le nombre de lignes visibles (fonctionne sur Webkit)
        display: '-webkit-box', // Nécessaire pour line-clamp
        WebkitBoxOrient: 'vertical', // Nécessaire pour line-clamp
      }}
    >
      <NodeHeader>
        <NodeHeaderTitle>{type}</NodeHeaderTitle>
        <NodeHeaderActions>
          <NodeHeaderMenuAction label='Open node menu'>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </NodeHeaderMenuAction>
        </NodeHeaderActions>
      </NodeHeader>

      {/* <footer> */}
      <BaseHandle type='target' id='in' position={Position.Right} />
      <BaseHandle type='source' id='out' position={Position.Left} />
      {/* </footer> */}
      <input
        className='m-1 bg-white p-2 text-sm'
        value={localValue}
        onChange={handleOnChangeValue}
      />
    </div>
  );
}
