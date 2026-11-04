import { FilterModifier } from './FilterModifier';
import { MergeModifier } from './MergeModifier';
import { AnyModifier } from './Modifier';
import { ReOrderModifier } from './ReOrderModifier';

export type ModifierFactory = () => AnyModifier;

// label contient une clé de traduction, résolue à l'affichage via t()
export const modifierRegistry: Record<
  string,
  {
    label: string;
    create: ModifierFactory;
  }
> = {
  MergeModifier: {
    label: 'modifier_label_merge',
    create: () => new MergeModifier(100, 100), // seuils max par défaut
  },
  FilterModifier: {
    label: 'modifier_label_filter',
    create: () => new FilterModifier(10000), // seuil max par défaut
  },
  ReOrderModifier: {
    label: 'modifier_label_reorder',
    create: () => new ReOrderModifier(),
  },
};
