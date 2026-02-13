import { FilterModifier } from './FilterModifier';
import { MergeModifier } from './MergeModifier';
import { AnyModifier } from './Modifier';
import { ReOrderModifier } from './ReOrderModifier';

export type ModifierFactory = () => AnyModifier;

export const modifierRegistry: Record<
  string,
  {
    label: string;
    create: ModifierFactory;
  }
> = {
  MergeModifier: {
    label: 'Merge Modifier',
    create: () => new MergeModifier(100, 100), // seuils max par défaut
  },
  HPModifier: {
    label: 'Filter Modifier',
    create: () => new FilterModifier(10000), // seuil max par défaut
  },
  ReOrderModifier: {
    label: 'Reorder Modifier',
    create: () => new ReOrderModifier(),
  },
};
