import { useCanvasSelectionContext } from '@/components/reducers/CanvasSelectionContext';

export const useCanvasSelection = () => {
  const { isSelected, getSelectedCanvases, hasSelectedElements, dispatch } =
    useCanvasSelectionContext();

  const setSelectionStart = (index: number) => {
    dispatch({ type: 'SET_SELECTION_START', payload: index });
  };

  const setSelectionEnd = (index: number) => {
    dispatch({ type: 'SET_SELECTION_END', payload: index });
  };

  const setSelection = (indexes: number[]) => {
    dispatch({
      type: 'SET_SELECTION',
      payload: indexes,
    });
  };

  return {
    isSelected,
    getSelectedCanvases,
    hasSelectedElements,
    setSelectionStart,
    setSelectionEnd,
    setSelection,
  };
};
