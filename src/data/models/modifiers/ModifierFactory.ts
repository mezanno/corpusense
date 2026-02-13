import { HPModifier } from './HPModifier';
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
    label: 'HP Modifier',
    create: () => new HPModifier(10000), // seuil max par défaut
  },
  ReOrderModifier: {
    label: 'Reorder Modifier',
    create: () => new ReOrderModifier(),
  },
};
