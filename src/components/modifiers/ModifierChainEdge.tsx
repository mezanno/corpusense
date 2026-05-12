import {
  BaseEdge,
  Edge,
  EdgeLabelRenderer,
  EdgeProps,
  getSimpleBezierPath,
  Position,
} from '@xyflow/react';
import { PlusCircle } from 'lucide-react';

export type ModifierChainEdgeProps = {
  modifierSourceId: string;
  onInsertAfter: (modifierId: string) => void;
};

type ModifierChainEdgeType = Edge<ModifierChainEdgeProps>;

const ModifierChainEdge = ({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
}: EdgeProps<ModifierChainEdgeType>) => {
  if (!data) return null; // sécurité TS
  const { modifierSourceId, onInsertAfter } = data;

  const handleAddNode = () => {
    onInsertAfter(modifierSourceId);
  };

  const [edgePath, labelX, labelY] = getSimpleBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right,
    targetPosition: Position.Right,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <button
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className='nodrag nopan cursor-pointer rounded-2xl bg-white'
          onClick={handleAddNode}
        >
          <PlusCircle size={20} />
        </button>
      </EdgeLabelRenderer>
    </>
  );
};

export default ModifierChainEdge;
