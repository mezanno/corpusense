import { useEffect } from 'react';

const useServiceWorker = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('sw is supported in this browser.');

      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}/sw.js`)
        .then((registration) => {
          console.log('sw registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('sw registration failed:', error);
        });
      //   });
    } else {
      console.warn('sw are not supported in this browser.');
    }
  }, []);
};

export default useServiceWorker;
