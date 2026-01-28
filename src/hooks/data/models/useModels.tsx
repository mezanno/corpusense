import { DataField, DataModelCreateDTO } from '@/data/models/DataModel';
import {
  getModelLiveRepository,
  getModelRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';

export const useModels = () => {
  const modelRepository = useMemo(() => getModelRepository(), []);
  const modelLiveRepository = useMemo(() => getModelLiveRepository(), []);

  const models = useLiveQuery(modelLiveRepository.getAll(), [], []);

  const getModelById = useCallback((id: string) => models.find((c) => c.id === id), [models]);

  const getDatafieldById = useCallback(
    (id: string): DataField | null => {
      for (const model of models) {
        const field = model.fields.find((f) => f.id === id);
        if (field) return field;
      }
      return null;
    },
    [models],
  );

  const createModel = async (modelDTO: DataModelCreateDTO) => {
    const id = uuid();
    const { name, description, fromModelId } = modelDTO;
    let fields: DataField[] = [];
    let prompt =
      "Voici un texte contenant une liste d'entités réparties sur une ou plusieurs lignes. Il est possible que plusieurs entités possèdent le même nom. Ton objectif est de me fournir la liste des entités structurées au format JSON selon le schéma suivant : {{schema}}\nTrès important : Si une ligne se termine par un mot coupé par un tiret (-), considère qu'elle se poursuit obligatoirement à la ligne suivante, sans espace ni ponctuation supplémentaire. Retourne uniquement la liste d’objets JSON sans autre texte ou commentaire.";
    if (fromModelId !== undefined) {
      try {
        const model = models.find((m) => m.id === fromModelId);
        if (!model) throw new Error('Model not found');
        fields = model.fields;
        prompt = model.prompt;
      } catch (error) {
        console.error('Error fetching model by ID:', error);
        // Handle the error as needed, e.g., show a notification or log it
      }
    }

    const newModel = {
      id,
      name: name,
      description: description,
      fields,
      prompt,
    };
    await modelRepository.add(newModel);
  };

  return {
    models,
    getModelById,
    getDatafieldById,
    createModel,
  };
};
