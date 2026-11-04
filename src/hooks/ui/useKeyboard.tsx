import { useEffect, useEffectEvent } from 'react';

const useKeyboard = ({ onKeyPressed }: { onKeyPressed: (key: string) => void }) => {
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    onKeyPressed(event.key);
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);
};

export default useKeyboard;
