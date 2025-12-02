import { Annotation } from '@/data/models/Annotation';
import { CanvasScope } from '@/data/models/Scope';
import {
  generateTextForAnnotation,
  generateTextForCollection,
  generateTextFromCanvas,
} from '@/data/utils/export';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import FileSaver from 'file-saver';

const useExportActions = () => {
  /**
   * Export all the text from all the annotations of a collection
   */
  const exportTextOfCollection = async (collectionId: string) => {
    try {
      const text = await generateTextForCollection(collectionId);
      console.log('Text generated:', text);

      FileSaver.saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'exported_text.txt');
    } catch (error) {
      console.error('Error generating text:', getErrorMessage(error));
    }
  };

  /**
   * Export all the text from all the annotations of a collection
   * @param action
   */
  const exportTextOfCanvas = async (scope: CanvasScope) => {
    const text = await generateTextFromCanvas(scope.canvasId, scope.collectionId);
    console.log('Text generated:', text);
    if (text === undefined || text.length === 0) {
      throw new Error(i18n.t('error_export_no_text'));
    }
    try {
      FileSaver.saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'exported_text.txt');
    } catch (error) {
      console.error('Error generating text:', getErrorMessage(error));
    }
  };

  const exportTextOfAnnotation = async (annotation: Annotation) => {
    const text = await generateTextForAnnotation(annotation);
    console.log('Text generated:', text);
    if (text === undefined || text.length === 0) {
      throw new Error(i18n.t('error_export_no_text'));
    }
    try {
      FileSaver.saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'exported_text.txt');
    } catch (error) {
      console.error('Error generating text:', getErrorMessage(error));
    }
  };

  return {
    exportTextOfCollection,
    exportTextOfCanvas,
    exportTextOfAnnotation,
  };
};

export default useExportActions;
