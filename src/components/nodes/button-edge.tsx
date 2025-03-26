import { useAppDispatch } from '@/hooks/hooks';
import { removeLinkBetweenAnnotationsRequest } from '@/state/reducers/annotations';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  MarkerType,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import './xy-nodes.css';

export default function ButtonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  source,
  target,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dispatch = useAppDispatch();

  const onEdgeClick = () => {
    dispatch(removeLinkBetweenAnnotationsRequest({ source, target }));
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={MarkerType.Arrow} style={style} />
      <EdgeLabelRenderer>
        <div
          className='button-edge__label nodrag nopan'
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <button className='button-edge__button' onClick={onEdgeClick}>
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
