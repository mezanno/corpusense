import { Annotation, ElementType, getBodies } from '@/data/models/Annotation';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { addLinkBetweenAnnotationsRequest } from '@/state/reducers/annotations';
import { getAnnotations } from '@/state/selectors/annotations';
import {
  addEdge,
  Background,
  Connection,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MouseEvent, useCallback, useContext, useEffect, useRef } from 'react';
import { HoverContext, HoverSetterContext } from './CanvasViewer';
import { AnnotationNode } from './nodes/annotation-node';
import ButtonEdge from './nodes/button-edge';
// import './xy-theme.css';

const nodeTypes = {
  annotation: AnnotationNode,
};

const edgeTypes = {
  buttonedge: ButtonEdge,
};

const getAllChildren = (
  nodeId: string,
  edges: Edge[],
  nodes: Node[],
  visited = new Set(),
): string[] => {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);

  const directChildren = edges.filter((edge) => edge.target === nodeId).map((edge) => edge.source);

  const indirectChildren = directChildren.flatMap((childId) =>
    getAllChildren(childId, edges, nodes, visited),
  );

  return [...directChildren, ...indirectChildren];
};

const AnnotationsFlow = ({
  canvasId,
  selectedNodeId,
}: {
  canvasId: string;
  selectedNodeId: string;
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { setCenter } = useReactFlow();

  const annotations = useAppSelector((state) => getAnnotations(state, canvasId));
  const dispatch = useAppDispatch();
  const hoveredElement = useContext(HoverContext).hoveredElement;
  const setHoveredElement = useContext(HoverSetterContext).setHoveredElement;

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('onConnect', params);
      dispatch(addLinkBetweenAnnotationsRequest({ source: params.source, target: params.target }));
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'buttonedge',
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === hoveredElement) {
          return {
            ...node,
            data: {
              ...node.data,
              hovered: true,
            },
          };
        } else {
          if (node.data.hovered === true) {
            return {
              ...node,
              data: {
                ...node.data,
                hovered: false,
              },
            };
          }
        }

        return node;
      }),
    );
  }, [hoveredElement, setNodes]);

  useEffect(() => {
    if (annotations?.length > 0) {
      const { nodes: existingNodes, edges: existingEdges } = fromAnnotationsToFlow(
        annotations,
        setHoveredElement,
      );
      setNodes(existingNodes);
      setEdges(existingEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [annotations]);

  // Center the selected node when it changes on the CanvasViewer
  useEffect(() => {
    if (selectedNodeId !== null) {
      const selectedNode = nodes.filter((node) => node.id === selectedNodeId)[0];
      if (selectedNode !== undefined) {
        const x =
          selectedNode.position.x +
          (selectedNode.measured?.width != null ? selectedNode.measured.width / 2 : 0);
        const y =
          selectedNode.position.y +
          (selectedNode.measured?.height != null ? selectedNode.measured.height / 2 : 0);
        const zoom = 1;

        void setCenter(x, y, { zoom, duration: 1000 });
      }
    }
  }, [selectedNodeId]);

  const dragStartPositions = useRef<Record<string, { x: number; y: number }>>({});

  const onNodeDragStart = useCallback((_event: MouseEvent, node: Node) => {
    dragStartPositions.current[node.id] = { ...node.position };
  }, []);

  const onNodeDragStop = useCallback(
    (_event: MouseEvent, node: Node) => {
      const initialPos = dragStartPositions.current[node.id];
      if (initialPos === undefined) return;

      const delta = {
        x: node.position.x - initialPos.x,
        y: node.position.y - initialPos.y,
      };

      const children = getAllChildren(node.id, edges, nodes);

      if (children.length > 0) {
        setNodes((nds) =>
          nds.map((n) => {
            if (children.includes(n.id)) {
              return {
                ...n,
                position: {
                  x: n.position.x + delta.x,
                  y: n.position.y + delta.y,
                },
              };
            }
            return n;
          }),
        );
      }

      delete dragStartPositions.current[node.id];
    },
    [edges, nodes, setNodes],
  );

  return (
    <div className='h-full w-full'>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        edges={edges}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

function fromAnnotationsToFlow(
  annotations: Annotation[],
  setHoveredElement: React.Dispatch<React.SetStateAction<string | null>>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  annotations.forEach((annotation) => {
    const { type } = getBodies(annotation);
    nodes.push({
      id: annotation.id,
      type: 'annotation',
      position: {
        x: annotation.target.selector.geometry.bounds.minX - (type === ElementType.ENTRY ? 200 : 0),
        y: annotation.target.selector.geometry.bounds.minY,
      },
      data: { annotation, setHoveredElement, hovered: false },
    });
    if (annotation.next !== undefined) {
      edges.push({
        id: `${annotation.id}-${annotation.next}`,
        source: annotation.id,
        target: annotation.next,
        type: 'buttonedge',
      });
    }
  });
  return { nodes, edges };
}

export default AnnotationsFlow;
