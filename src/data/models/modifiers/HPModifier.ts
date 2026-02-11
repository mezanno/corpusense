import { getDimensions } from '@/data/utils/annotations';
import { v4 as uuid } from 'uuid';
import { Annotation } from '../Annotation';
import { Modifier } from './Modifier';

type HPModiferValues = {
  hpThreshold: number;
};

export class HPModifier extends Modifier<HPModiferValues> {
  readonly hpThresholdMax: number;

  constructor(hpThresholdMax: number) {
    super(uuid(), 'HPModifier');
    this.hpThresholdMax = hpThresholdMax;
  }

  apply = (data: Annotation[], values: HPModiferValues) => {
    if (data.length > 1) {
      const sizeThreshold = values.hpThreshold;
      const annotations = [...data];
      for (let i = 0; i < annotations.length; i++) {
        const dimensions = getDimensions(annotations[i]);
        if (dimensions.width * dimensions.height < sizeThreshold) {
          annotations.splice(i, 1);
          i--;
        }
      }
      return annotations;
    }
    return data;
  };
}
