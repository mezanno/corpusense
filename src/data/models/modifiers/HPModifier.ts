import { getDimensions } from '@/data/utils/annotations';
import i18n from '@/i18n';
import { v4 as uuid } from 'uuid';
import z from 'zod';
import { Annotation } from '../Annotation';
import { Modifier } from './Modifier';

const hpSchema = z.object({
  hpThreshold: z.number().min(0),
});

export class HPModifier extends Modifier<typeof hpSchema> {
  type = 'HPModifier';
  readonly hpThresholdMax: number;

  constructor(hpThresholdMax: number) {
    super(
      uuid(),
      'HPModifier',
      hpSchema,
      {
        hpThreshold: {
          label: i18n.t('form_label_modifier_hp_threshold'),
          description: i18n.t('form_description_modifier_hp_threshold'),
          min: 0,
          max: hpThresholdMax,
          step: 1,
        },
      },
      i18n.t('form_description_modifier_hp'),
    );
    this.hpThresholdMax = hpThresholdMax;
  }

  apply = (data: Annotation[], values: z.infer<typeof hpSchema>) => {
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
