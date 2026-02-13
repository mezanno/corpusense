import { getDimensions } from '@/data/utils/annotations';
import i18n from '@/i18n';
import { v4 as uuid } from 'uuid';
import z from 'zod';
import { Annotation } from '../Annotation';
import { Modifier } from './Modifier';

const hpSchema = z.object({
  filterType: z.enum(['HP', 'LP']).default('HP'),
  threshold: z.number().min(0),
  dimension: z.enum(['area', 'width', 'height']).default('area'),
});

export class FilterModifier extends Modifier<typeof hpSchema> {
  type = 'FilterModifier';
  readonly thresholdMax: number;

  constructor(hpThresholdMax: number) {
    super(
      uuid(),
      'FilterModifier',
      hpSchema,
      {
        filterType: {
          label: i18n.t('form_label_modifier_filter_type'),
          description: i18n.t('form_description_modifier_filter_type'),
          options: ['HP', 'LP'],
        },
        threshold: {
          label: i18n.t('form_label_modifier_filter_threshold'),
          description: i18n.t('form_description_modifier_filter_threshold'),
          min: 0,
          max: hpThresholdMax,
          step: 1,
        },
        dimension: {
          label: i18n.t('form_label_modifier_filter_dimension'),
          description: i18n.t('form_description_modifier_filter_dimension'),
          options: ['area', 'width', 'height'],
        },
      },
      i18n.t('form_description_modifier_filter'),
    );
    this.thresholdMax = hpThresholdMax;
  }

  apply = (data: Annotation[], values: z.infer<typeof hpSchema>) => {
    console.log('Applying FilterModifier with values: ', values);
    if (data.length > 1) {
      const sizeThreshold = values.threshold;
      const annotations = [...data];
      return annotations.filter((a) => {
        const dimensions = getDimensions(a);
        const valueToCompare =
          values.dimension === 'area'
            ? dimensions.width * dimensions.height
            : values.dimension === 'width'
              ? dimensions.width
              : dimensions.height;
        return valueToCompare >= sizeThreshold;
      });
    }
    return data;
  };
}
