import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import { CanvasScope, CollectionScope, isCanvasScope } from '@/data/models/Scope';
import useModifierChain from '@/hooks/data/modifiers/useModifierChain';
import useModifierChainIO from '@/hooks/data/modifiers/useModifierChainIO';
import useDialog from '@/hooks/ui/useDialog';
import {
  Background,
  Controls,
  Edge,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FolderOpen, Play, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddNode from './AddNode';
import ModifierNode from './ModifierNode';
import './xy-theme.css';

const nodeTypes = {
  modifierNode: ModifierNode,
  addNode: AddNode,
};
const NODE_WIDTH = 280;
const GAP = 50;

const ModifierChainFlow = ({
  scope,
  initialChainId,
}: {
  scope?: CollectionScope | CanvasScope;
  initialChainId?: string | null;
}) => {
  const { t } = useTranslation();
  const { openSaveModifierChainDialog, openLoadModifierChainDialog } = useDialog();
  const [modifiers, setModifiers] = useState<AnyModifier[]>([]);
  const [modifierValues, setModifierValues] = useState<Record<string, unknown>>({});
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const { applyModifierChainToScope } = useModifierChain();
  const { loadModifierChain } = useModifierChainIO();

  const createModifier = (type: string = 'MergeModifier') => {
    const factory = modifierRegistry[type];
    if (factory === undefined || factory === null) return;
    return factory.create();
  };

  const addModifier = (type: string = 'MergeModifier') => {
    const newModifier = createModifier(type);
    if (!newModifier) return;
    setModifiers((prev) => [...prev, newModifier]);
    setModifierValues((prev) => ({
      ...prev,
      [newModifier.id]: newModifier.schema.parse({}),
    }));
  };

  const insertModifierAt = (index: number, type: string = 'MergeModifier') => {
    const newModifier = createModifier(type);
    if (!newModifier) return;

    setModifiers((prev) => [...prev.slice(0, index), newModifier, ...prev.slice(index)]);
    setModifierValues((prev) => ({
      ...prev,
      [newModifier.id]: newModifier.schema.parse({}),
    }));
  };

  const insertModifierAfter = (modifierId: string) => {
    const index = modifiers.findIndex((m) => m.id === modifierId);
    if (index !== -1) insertModifierAt(index + 1);
  };

  const insertModifierBefore = (modifierId: string) => {
    const index = modifiers.findIndex((m) => m.id === modifierId);
    if (index !== -1) insertModifierAt(index);
  };

  const deleteModifier = (modifierId: string) => {
    setModifiers(modifiers.filter((m) => m.id !== modifierId));
    setModifierValues((prev) => {
      const copy = { ...prev };
      delete copy[modifierId];
      return copy;
    });
  };

  const updateModifierValues = (modifierId: string, values: unknown) => {
    setModifierValues((prev) => {
      const previousValues = prev[modifierId];

      // Comparaison simple (suffisante ici car objets plats)
      if (JSON.stringify(previousValues) === JSON.stringify(values)) {
        return prev; // permet d'éviter de déclencher un re-render
      }

      return { ...prev, [modifierId]: values };
    });
  };

  // Changer le type d'un modifier (via le select)
  const changeModifierType = (modifierId: string, newType: string) => {
    const factory = modifierRegistry[newType];
    if (factory === undefined || factory === null) return;

    setModifiers((prev) =>
      prev.map((m) => {
        if (m.id !== modifierId) return m;

        const newModifier = factory.create();
        newModifier.id = m.id; // conserver le même id
        return newModifier;
      }),
    );

    // Réinitialiser les valeurs avec les defaults du nouveau schema
    setModifierValues((prev) => {
      const newModifier = factory.create();
      return {
        ...prev,
        [modifierId]: newModifier.schema.parse({}), // <-- applique les valeurs par défaut
      };
    });
  };

  const applyChain = async () => {
    if (scope && isCanvasScope(scope)) {
      await applyModifierChainToScope(modifiers, modifierValues, scope);
    }
  };

  const saveChain = () => {
    openSaveModifierChainDialog(modifiers, modifierValues);
  };

  const handleLoadChain = () => {
    openLoadModifierChainDialog(({ modifiers: loadedModifiers, modifierValues: loadedValues }) => {
      setNodes([]);
      setEdges([]);
      setModifiers(loadedModifiers);
      setModifierValues(loadedValues);
    });
  };

  useEffect(() => {
    if (initialChainId === undefined || initialChainId === null) return;

    void (async () => {
      try {
        const { modifiers: loadedModifiers, modifierValues: loadedValues } =
          await loadModifierChain(initialChainId);
        setNodes([]);
        setEdges([]);
        setModifiers(loadedModifiers);
        setModifierValues(loadedValues);
      } catch (error) {
        console.error('Failed to load modifier chain:', error);
      }
    })();
  }, [initialChainId]);

  useEffect(() => {
    if (modifiers.length === 0 && initialChainId === null) {
      setNodes([
        {
          id: 'add',
          type: 'addNode',
          position: { x: 0, y: 0 },
          data: { onAdd: () => addModifier() },
        },
      ]);
      setEdges([]);
      return;
    }

    const newNodes: Node[] = modifiers.map((modifier, index) => ({
      id: modifier.id,
      type: 'modifierNode',
      position: {
        x: index * (NODE_WIDTH + GAP),
        y: 0,
      },
      data: {
        modifier,
        initialValues: modifierValues[modifier.id],
        onDelete: deleteModifier,
        onChange: updateModifierValues,
        onTypeChange: changeModifierType,
        onInsertAfter: insertModifierAfter,
        onInsertBefore: insertModifierBefore,
      },
    }));

    const newEdges: Edge[] = modifiers.slice(1).map((modifier, index) => ({
      id: `e-${modifiers[index].id}-${modifier.id}`,
      source: modifiers[index].id,
      target: modifier.id,
      type: 'smoothstep',
    }));

    setNodes((oldNodes) =>
      newNodes.map((newNode) => {
        const existing = oldNodes.find((n) => n.id === newNode.id);

        if (existing) {
          return {
            ...existing,
            position: newNode.position,
            data: newNode.data,
          };
        }

        return newNode;
      }),
    );

    setEdges(newEdges);
  }, [modifiers, modifierValues]);

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mt-4 flex justify-center space-x-2'>
        {scope && (
          <button onClick={handleLoadChain} className='soft-button' title={t('btn_load_modifiers')}>
            <FolderOpen size={16} />
          </button>
        )}
        {modifiers.length > 0 && (
          <>
            {scope && (
              <button
                onClick={() => void applyChain()}
                className='soft-button'
                title={t('btn_apply_modifiers')}
              >
                <Play size={16} />
              </button>
            )}
            <button
              onClick={() => void saveChain()}
              className='soft-button'
              title={t('btn_save_modifierchain')}
            >
              <Save size={16} />
            </button>
          </>
        )}
      </div>

      <div className='min-h-0 flex-1'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          selectionOnDrag={false}
          //TODO: à revoir, ça log un clic à chaque fois qu'on clique sur un node, même pour interagir avec les inputs du form
          onNodeClick={() => console.log('clic')}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      {/* Animation CSS */}
      <style>
        {`
          .react-flow__node {
            transition: transform 0.25s ease;
          }
        `}
      </style>
    </div>
  );
};

export default ModifierChainFlow;
