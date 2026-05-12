import { useEffect } from 'react';

const useKeyboard = ({ onKeyPressed }: { onKeyPressed: (key: string) => void }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyPressed(event.key);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onKeyPressed]);
};

export default useKeyboard;
