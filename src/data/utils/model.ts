import i18n from '@/i18n';
import { DataField, DataModel } from '../models/DataModel';

const generatePreview = (model: DataModel) => {
  let preview = '{';
  for (let i = 0; i < model.fields.length; i++) {
    const field = model.fields[i];
    preview = preview.concat(`"${field.name}":{`);
    preview = preview.concat(`"type":"${field.type}",`);
    preview = preview.concat(
      `"description":"${field.description}.${field?.generated === true ? i18n.t('ia_generated') : ''}"`,
    );
    preview = preview.concat(`}`);
    if (i !== model.fields.length - 1) {
      preview = preview.concat(',');
    }
  }
  preview += '}';
  return preview;
};

const generateSchema = (model: DataModel, lastEntryFound?: unknown) => {
  const modelWithNumberedLines = {
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
      ...modelWithNumberedLines.fields.reduce(
        (acc, field) => {
          acc[field.name] = generateField(
            field,
            getValueForFieldInObject<string>(lastEntryFound, field.name),
          );
          return acc;
        },
        {} as Record<string, { type: string; description: string }>,
      ),
    },
  };
  return JSON.stringify(schema, null, 2);
};

/*
Cette fonction permet de récupérer la valeur d'un champ dans un objet, même si ce champ est imbriqué profondément. 
Elle utilise une approche récursive pour parcourir l'objet et ses sous-objets à la recherche du champ spécifié. 
La fonction prend également en compte les références circulaires pour éviter les boucles infinies.
*/
const getValueForFieldInObject = <T = unknown>(
  obj: unknown,
  fieldName: string,
  visited = new Set<unknown>(), //pour éviter les références circulaires (boucles infinies)
): T | undefined => {
  if (typeof obj !== 'object' || obj === null) return undefined;
  if (visited.has(obj)) return undefined;

  visited.add(obj);

  if (fieldName in obj) {
    return (obj as Record<string, unknown>)[fieldName] as T;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = getValueForFieldInObject<T>(item, fieldName, visited);
      if (result !== undefined) return result;
    }
  } else {
    for (const key in obj) {
      const result = getValueForFieldInObject<T>(
        (obj as Record<string, unknown>)[key],
        fieldName,
        visited,
      );
      if (result !== undefined) return result;
    }
  }

  return undefined;
};

const generateField = (field: DataField, lastValueFound?: string) => {
  if (field.isArray === true) {
    return {
      type: 'array',
      description: (field.description ?? '').concat(
        field?.generated === true ? i18n.t('ia_generated') : '',
      ),
      items: {
        type: field.type,
      },
    };
  } else {
    if (field.getPreviousValue === true && lastValueFound !== undefined) {
      return {
        type: field.type,
        description: (field.description ?? '').concat(
          field.generated === true ? i18n.t('ia_generated') : '',
          ' ',
          i18n.t('previous_value_description', { previousValue: lastValueFound }),
        ),
      };
    } else {
      return {
        type: field.type,
        description: (field.description ?? '').concat(
          field.generated === true ? i18n.t('ia_generated') : '',
        ),
      };
    }
  }
};

const hasPreviousValueField = (model: DataModel): boolean => {
  return model.fields.some((field) => field.getPreviousValue === true);
};

export { generatePreview, generateSchema, hasPreviousValueField };
