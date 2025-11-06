import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';

type ExperimentalContextType = {
  experimentalFeaturesActivated: boolean;
  setExperimentalFeaturesActivated: Dispatch<SetStateAction<boolean>>;
};

const experimentalContext = createContext<ExperimentalContextType | undefined>(undefined);

export const getIsExperimentalFeaturesActivated = () => {
  return localStorage.getItem('experimentalFeatures') === 'true';
};

export const ExperimentalProvider = ({ children }: { children: React.ReactNode }) => {
  const [experimentalFeaturesActivated, setExperimentalFeaturesActivated] = useState<boolean>(() =>
    getIsExperimentalFeaturesActivated(),
  );

  // synchronise localStorage quand l’état change
  useEffect(() => {
    if (experimentalFeaturesActivated) {
      localStorage.setItem('experimentalFeatures', 'true');
    } else {
      localStorage.removeItem('experimentalFeatures');
    }
  }, [experimentalFeaturesActivated]);

  return (
    <experimentalContext.Provider
      value={{ experimentalFeaturesActivated, setExperimentalFeaturesActivated }}
    >
      {children}
    </experimentalContext.Provider>
  );
};

const useExperimental = () => {
  const context = useContext(experimentalContext);
  if (!context) {
    throw new Error('useExperimental doit être utilisé dans un <ExperimentalProvider>');
  }
  return context;
};

export default useExperimental;
