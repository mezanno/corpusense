import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import { CanvasScope, CollectionScope, isCanvasScope } from '@/data/models/Scope';
import useModifierChain from '@/hooks/data/modifiers/useModifierChain';
import { Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModifierCard from '../modifiers/ModifierCard';
import { Card, CardContent } from '../ui/card';

const ModifierChainForm = ({ scope }: { scope: CollectionScope | CanvasScope }) => {
  const { t } = useTranslation();
  const [modifiers, setModifiers] = useState<AnyModifier[]>([]);
  const [modifierValues, setModifierValues] = useState<Record<string, unknown>>({});
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

  const applychain = async () => {
    if (isCanvasScope(scope)) {
      await applyModifierChain(modifiers, modifierValues);
    }
  };

  return (
    <div className='flex space-x-2'>
      {modifiers.map((modifier) => (
        <ModifierCard
          modifier={modifier}
          key={modifier.id}
          onDelete={deleteModifier}
          onChange={updateModifierValues}
          onTypeChange={changeModifierType}
        />
      ))}
      <div className='h-full'>
        <Card className='card-file h-fit border-dashed' onClick={() => addModifier()}>
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Plus size={48} />
            <span className='text-center'>{t('btn_add_modifier')}</span>
          </CardContent>
        </Card>
        {modifiers.length > 0 && (
          <Card className='card-file h-fit border-dashed' onClick={() => void applychain()}>
            <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
              <Play size={48} />
              <span className='text-center'>{t('btn_apply_modifiers')}</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ModifierChainForm;
