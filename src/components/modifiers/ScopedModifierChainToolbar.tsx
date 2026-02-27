import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { CanvasScope } from '@/data/models/Scope';
import useAnnotationModifierActions from '@/hooks/data/annotations/useAnnotationModifierActions';
import { debounce } from 'lodash';
import { Eye, Play } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../ui/checkbox';
import { Field, FieldLabel } from '../ui/field';

type Props = {
  scope: CanvasScope;
  modifiers: AnyModifier[];
  modifierValues: Record<string, unknown>;
  showPreview: boolean;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ScopedModifierChainToolbar({
  scope,
  modifiers,
  modifierValues,
  showPreview,
  setShowPreview,
}: Props) {
  const { t } = useTranslation();
  const { applyModifierChain } = useAnnotationModifierActions({ scope, showPreview });

  const applyChain = async () => {
    await applyModifierChain(modifiers, modifierValues);
  };

  //we use a debounced function to preview the modifier chain, to avoid triggering too many previews while the user is changing values
  const debouncePreview = useMemo(
    () =>
      debounce(async () => {
        console.log('Previewing modifier chain with values:', modifierValues);
        await applyChain();
      }, 300),
    [modifierValues, applyChain],
  );

  useEffect(() => {
    if (showPreview) {
      void debouncePreview();
    }
    return () => {
      debouncePreview.cancel();
    };
  }, [modifierValues, showPreview]);

  if (modifiers.length === 0) return null;

  const handleChange = (checked: boolean) => {
    setShowPreview(checked);
  };

  return (
    <>
      <button
        onClick={() => void applyChain()}
        className='soft-button'
        title={t('btn_apply_modifiers')}
      >
        <Play size={16} />
      </button>

      <Field
        orientation='horizontal'
        className='soft-button w-auto'
        title={t('btn_modifierchain_preview')}
      >
        <Checkbox id='toggle-preview' checked={showPreview} onCheckedChange={handleChange} />
        <FieldLabel htmlFor='toggle-preview'>
          <Eye />
        </FieldLabel>
      </Field>
    </>
  );
}
