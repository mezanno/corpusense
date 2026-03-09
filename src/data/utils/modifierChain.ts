import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import { CanvasScope, CollectionScope } from '@/data/models/Scope';
import {
  getAnnotationRepository,
  getModifierChainRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { Annotation } from '../models/Annotation';

export type ModifierChainData = {
  modifiers: AnyModifier[];
  modifierValues: Record<string, unknown>;
  name?: string;
};

const getModifiersAndValues = async (id: string): Promise<ModifierChainData> => {
  const modifierChainRepository = getModifierChainRepository();
  const modifierDTO = await modifierChainRepository.getById(id);

  const modifiers = modifierDTO.modifiers.map((dto) => {
    const factory = modifierRegistry[dto.type];
    if (factory === undefined || factory === null) {
      throw new Error(`No factory found for modifier type: ${dto.type}`);
    }
    const modifier = factory.create();
    modifier.id = dto.id; // Assigner l'ID du DTO au modifier créé
    return modifier;
  });

  const modifierValues: Record<string, unknown> = {};
  modifierDTO.modifiers.forEach((dto) => {
    modifierValues[dto.id] = dto.values;
  });

  return { modifiers, modifierValues, name: modifierDTO.name };
};

const applyModifiersToScope = async (
  modifiers: AnyModifier[],
  values: Record<string, unknown>,
  scope: CollectionScope | CanvasScope,
) => {
  if (modifiers.length === 0) return;

  const annotationRepository = getAnnotationRepository();
  const scopeAnnotations = await annotationRepository.getByScope(scope);

  if (scopeAnnotations.length === 0) return;

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

const applyModifierChainToAnnotations = async (
  modifierChainId: string,
  annotations: Annotation[],
) => {
  try {
    const { modifiers, modifierValues } = await getModifiersAndValues(modifierChainId);

    let updatedAnnotations = [...annotations];
    modifiers.forEach((modifier) => {
      const values = modifierValues[modifier.id];
      if (values !== undefined) {
        const rawValues = modifierValues[modifier.id] ?? {};
        const parsedValues = modifier.schema.parse(rawValues);
        updatedAnnotations = modifier.apply(updatedAnnotations, parsedValues);
      }
    });

    return updatedAnnotations;
  } catch (error) {
    console.error(`Error applying modifier chain with id "${modifierChainId}":`, error);
    return annotations;
  }
};

export { applyModifierChainToAnnotations, applyModifiersToScope, getModifiersAndValues };
