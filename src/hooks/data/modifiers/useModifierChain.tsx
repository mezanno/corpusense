import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { CanvasScope, CollectionScope } from '@/data/models/Scope';
import { getAnnotationRepository } from '@/data/repositories/indexeddb/dbFactory';

const useModifierChain = () => {
  const applyModifierChainToScope = async (
    modifiers: AnyModifier[],
    values: Record<string, unknown>,
    scope: CollectionScope | CanvasScope,
  ) => {
    if (modifiers.length === 0) return;

    const annotationRepository = getAnnotationRepository();
    const scopeAnnotations = await annotationRepository.getByScope(scope);

    let annotations = [...scopeAnnotations];
    modifiers.forEach((modifier) => {
      const modifierValues = values[modifier.id];
      if (modifierValues !== undefined) {
        const rawValues = values[modifier.id] ?? {};
        const parsedValues = modifier.schema.parse(rawValues);
        annotations = modifier.apply(annotations, parsedValues);
      }
    });

    await annotationRepository.deleteByIds(scopeAnnotations.map((a) => a.id));
    await annotationRepository.addAll(annotations);
  };

  return { applyModifierChainToScope };
};

export default useModifierChain;
