import { AnyModifier } from '@/data/models/modifiers';
import { MergeModifier } from '@/data/models/modifiers/MergeModifier';
import { Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModifierCard from '../modifiers/ModifierCard';
import { Card, CardContent } from '../ui/card';

const ModifierChainForm = () => {
  const { t } = useTranslation();
  const [modifiers, setModifiers] = useState<AnyModifier[]>([]);
  const [modifierValues, setModifierValues] = useState<Record<string, unknown>>({});
  console.log('modifierValues: ', modifierValues);

  const addModifier = () => {
    // Exemple : ajouter un MergeModifier par défaut
    const newModifier = new MergeModifier(50, 50); // seuils par défaut
    setModifiers([...modifiers, newModifier]);
  };

  const deleteModifier = (modifierId: string) => {
    setModifiers(modifiers.filter((m) => m.id !== modifierId));
  };

  const updateModifierValues = (modifierId: string, values: unknown) => {
    setModifierValues((prev) => {
      const previousValues = prev[modifierId];

      // Comparaison simple (suffisante ici car objets plats)
      if (JSON.stringify(previousValues) === JSON.stringify(values)) {
        return prev; // permet d'éviter de déclencher un re-render
      }

      return {
        ...prev,
        [modifierId]: values,
      };
    });
  };

  return (
    <div className='flex space-x-2'>
      {modifiers.map((modifier) => (
        <ModifierCard
          modifier={modifier}
          key={modifier.id}
          onDelete={deleteModifier}
          onChange={updateModifierValues}
        />
      ))}
      <div className='h-full'>
        <Card className='card-file h-fit border-dashed' onClick={addModifier}>
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Plus size={48} />
            <span className='text-center'>{t('btn_add_modifier')}</span>
          </CardContent>
        </Card>
        {modifiers.length > 0 && (
          <Card className='card-file h-fit border-dashed'>
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
