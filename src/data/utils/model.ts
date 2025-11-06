import i18next from 'i18next';
import { DataField, DataModel } from '../models/DataModel';

const generatePreview = (model: DataModel) => {
  let preview = '{';
  for (let i = 0; i < model.fields.length; i++) {
    const field = model.fields[i];
    preview = preview.concat(`"${field.name}":{`);
    preview = preview.concat(`"type":"${field.type}",`);
    preview = preview.concat(
      `"description":"${field.description}.${field?.generated === true ? i18next.t('ia_generated') : ''}"`,
    );
    preview = preview.concat(`}`);
    if (i !== model.fields.length - 1) {
      preview = preview.concat(',');
    }
  }
  preview += '}';
  return preview;
};

const generateSchema = (model: DataModel) => {
  const modelWithConfidfidence = {
    ...model,
    fields: [
      ...model.fields,
      {
        id: 'position',
        name: 'position',
        type: 'array',
        items: {
          type: 'number',
        },
        description:
          "valeur indiquée au début de chaque ligne de texte entre double accolades, par exemple {{12}} indique que l'élément commence à la ligne 12 du texte. Si l'élément ne correspond pas à une ligne précise, mets la valeur [-1]. Un élément peut couvrir plusieurs lignes, il faut alors indiquer toutes lignes qu'il couvre, dans un tableau, séparées par des virgules, par exemple : [12,13,14].",
        generated: false,
        color: '#000000',
      },
    ],
  };
  const schema = {
    type: 'object',
    properties: {
      ...modelWithConfidfidence.fields.reduce(
        (acc, field) => {
          acc[field.name] = generateField(field);
          return acc;
        },
        {} as Record<string, { type: string; description: string }>,
      ),
    },
  };
  return JSON.stringify(schema, null, 2);
};

const generateField = (field: DataField) => {
  if (field.isArray === true) {
    return {
      type: 'array',
      description: (field.description ?? '').concat(
        field?.generated === true ? i18next.t('ia_generated') : '',
      ),
      items: {
        type: field.type,
      },
    };
  } else {
    return {
      type: field.type,
      description: (field.description ?? '').concat(
        field.generated === true ? i18next.t('ia_generated') : '',
      ),
    };
  }
};

export { generatePreview, generateSchema };
