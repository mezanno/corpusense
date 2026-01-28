import { DataModel } from '@/data/models/DataModel';
import { getModelRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useAppDispatch } from '@/hooks/hooks';
import i18n from '@/i18n';
import { pushError, pushInfo } from '@/state/reducers/events';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';
import { useMemo } from 'react';

export const useModelIO = () => {
  const appDispatch = useAppDispatch();
  const modelRepository = useMemo(() => getModelRepository(), []);

  const saveModel = async (model: DataModel) => {
    await modelRepository.update(model);
    appDispatch(pushInfo(i18n.t('info_model_saved')));
  };

  const removeModel = async (id: string) => {
    await modelRepository.deleteById(id);
  };

  const exportModel = async (id: string) => {
    try {
      const model = await modelRepository.getById(id);

      FileSaver.saveAs(
        new Blob([JSON.stringify(model)], { type: 'application/json' }),
        `${model.name}.json`,
      );
    } catch (error) {
      console.error('Error exporting model:', error);
      appDispatch(pushError('Error exporting model: ' + getErrorMessage(error)));
    }
  };

  const importModel = async (data: object) => {
    try {
      const model = data as DataModel; //TODO: validate the model structure and display error if invalid
      const existingModel = await modelRepository.getByName(model.name);
      if (existingModel !== null) {
        appDispatch(pushError(i18n.t('error_mode_name_exists', { name: model.name })));
        return;
      }
      await modelRepository.add(model);
    } catch (error) {
      //TODO: faire une gestion des erreurs plus user friendly
      console.error('Error importing model:', error);
      appDispatch(pushError('Error importing model: ' + getErrorMessage(error)));
    }
  };

  return {
    saveModel,
    removeModel,
    exportModel,
    importModel,
  };
};
