import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import { CanvasScope, CollectionScope, isCanvasScope } from '@/data/models/Scope';
import useModifierChain from '@/hooks/data/annotations/useModifierChain';
import { Background, Controls, Edge, Node, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddNode from './AddNode';
import ModifierNode from './ModifierNode';

const nodeTypes = {
  modifierNode: ModifierNode,
  addNode: AddNode,
};
const NODE_WIDTH = 280;
const GAP = 50;

const ModifierChainFlow = ({ scope }: { scope: CollectionScope | CanvasScope }) => {
  const { t } = useTranslation();
  const [modifiers, setModifiers] = useState<AnyModifier[]>([]);
  const [modifierValues, setModifierValues] = useState<Record<string, unknown>>({});
  console.log('scope: ', scope);

  console.log('modifierValues: ', modifierValues);
  const { applyModifierChain } = useModifierChain({
    collectionId: scope.collectionId,
    canvasId: isCanvasScope(scope) ? scope.canvasId : '',
  });

  const addModifier = (type: string = 'MergeModifier') => {
    const factory = modifierRegistry[type];
    if (factory === undefined || factory === null) return;

    const newModifier = factory.create();
    setModifiers((prev) => [...prev, newModifier]);
  };

  const insertModifierAt = (index: number, type: string = 'MergeModifier') => {
    const factory = modifierRegistry[type];
    if (factory === undefined || factory === null) return;

    const newModifier = factory.create();

    setModifiers((prev) => [...prev.slice(0, index), newModifier, ...prev.slice(index)]);
  };

  const insertAfter = (modifierId: string) => {
    const index = modifiers.findIndex((m) => m.id === modifierId);
    if (index !== -1) insertModifierAt(index + 1);
  };

  const insertBefore = (modifierId: string) => {
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

    // Réinitialiser ses valeurs (évite des incohérences si les champs sont différents entre les types)
    //TODO : bug
    // setModifierValues((prev) => {
    //   const copy = { ...prev };
    //   delete copy[modifierId];
    //   return copy;
    // });
    setModifierValues((prev) => ({ ...prev, [modifierId]: undefined }));
  };

  const applyChain = async () => {
    if (isCanvasScope(scope)) {
      await applyModifierChain(modifiers, modifierValues);
    }
  };

  const { nodes, edges } = useMemo(() => {
    if (modifiers.length === 0) {
      const n: Node[] = [
        {
          id: 'add',
          type: 'addNode',
          position: { x: 0, y: 0 },
          data: { onAdd: () => addModifier() },
        },
      ];
      return { nodes: n, edges: [] };
    }

    const n: Node[] = modifiers.map((modifier, index) => ({
      id: modifier.id,
      type: 'modifierNode',
      position: {
        x: index * (NODE_WIDTH + GAP),
        y: 0,
      },
      data: {
        modifier,
        onDelete: deleteModifier,
        onChange: updateModifierValues,
        onTypeChange: changeModifierType,
        onInsertAfter: insertAfter,
        onInsertBefore: insertBefore,
      },
    }));

    const e: Edge[] = modifiers.slice(1).map((modifier, index) => ({
      id: `e-${modifiers[index].id}-${modifier.id}`,
      source: modifiers[index].id,
      target: modifier.id,
      type: 'smoothstep',
    }));

    return { nodes: n, edges: e };
  }, [
    modifiers,
    updateModifierValues,
    changeModifierType,
    addModifier,
    deleteModifier,
    insertAfter,
    insertBefore,
  ]);

  return (
    <div className='h-full w-full'>
      {modifiers.length > 0 && (
        <div className='mt-4 flex justify-center'>
          <button onClick={() => void applyChain()} className='soft-button'>
            <Play /> {t('btn_apply_modifiers')}
          </button>
        </div>
      )}
      <ReactFlow
        className='flex-1'
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
  );
};

export default ModifierChainFlow;
