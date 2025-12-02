import { Annotation, getAnnotationType } from '@/data/models/Annotation';
import { Scope } from '@/data/models/Scope';
import { getAnnotationLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useMemo, useState } from 'react';

type AnnotationContextValue = {
  scope: Scope | null;
  setScope: (scope: Scope) => void;
  annotations: Annotation[];
  getAnnotationsByTypes: (types: string[]) => Annotation[];
  getLastOrderByType: (type: string) => number;
};

const AnnotationContext = createContext<AnnotationContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const AnnotationContextProvider = ({ children }: Props) => {
  const [scope, setScope] = useState<Scope | null>(null);
  const annotationLiveRepository = useMemo(() => getAnnotationLiveRepository(), []);

  const queryFn = scope ? annotationLiveRepository.getByScope(scope) : () => Promise.resolve([]);

  const annotations = useLiveQuery(queryFn, [scope], [] as Annotation[]);

  const value = useMemo<AnnotationContextValue>(() => {
    const getAnnotationsByTypes = (types: string[]) =>
      annotations.filter((annotation) => types.includes(getAnnotationType(annotation)));

    const getLastOrderByType = (type: string) => {
      const annotationsByType = getAnnotationsByTypes([type]);
      if (annotationsByType.length === 0) {
        return 1;
      }
      return annotationsByType[annotationsByType.length - 1].order ?? 1;
    };

    return {
      scope,
      setScope,
      annotations,
      getAnnotationsByTypes,
      getLastOrderByType,
    };
  }, [annotations]);

  return <AnnotationContext.Provider value={value}>{children}</AnnotationContext.Provider>;
};

export const useAnnotationContext = () => {
  const ctx = useContext(AnnotationContext);
  if (!ctx) {
    throw new Error('useAnnotations must be used inside <AnnotationContextProvider>');
  }
  return ctx;
};
