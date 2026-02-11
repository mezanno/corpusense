import { Annotation, getAnnotationType } from '@/data/models/Annotation';
import { Scope } from '@/data/models/Scope';
import {
  getAnnotationLiveRepository,
  getAnnotationTempLiveRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useMemo, useState } from 'react';

type AnnotationContextValue = {
  scope: Scope | null;
  setScope: (scope: Scope) => void;
  scopeAnnotations: Annotation[];
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
  const annotationTempLiveRepository = useMemo(() => getAnnotationTempLiveRepository(), []);

  const queryFn = scope ? annotationLiveRepository.getByScope(scope) : () => Promise.resolve([]);
  const queryFnTemp = scope
    ? annotationTempLiveRepository.getByScope(scope)
    : () => Promise.resolve([]);

  const annotations = useLiveQuery(queryFn, [scope], [] as Annotation[]);
  const tempAnnotations = useLiveQuery(queryFnTemp, [scope], [] as Annotation[]);
  // const scopeAnnotations = [...annotations, ...tempAnnotations];
  const scopeAnnotations = useMemo(
    () => (tempAnnotations.length > 0 ? tempAnnotations : annotations),
    [annotations, tempAnnotations],
  );
  console.log('scopeAnnotations: ', scopeAnnotations);

  const value = useMemo<AnnotationContextValue>(() => {
    const byType = new Map<string, Annotation[]>();
    for (const annotation of scopeAnnotations) {
      const type = getAnnotationType(annotation);
      if (!byType.has(type)) byType.set(type, []);
      byType.get(type)!.push(annotation);
    }

    const getAnnotationsByTypes = (types: string[]) => types.flatMap((t) => byType.get(t) ?? []);

    const getLastOrderByType = (type: string) => {
      const list = byType.get(type);
      if (!list || list.length === 0) return 1;
      return Math.max(...list.map((a) => a.order ?? 1));
    };

    return {
      scope,
      setScope,
      scopeAnnotations,
      getAnnotationsByTypes,
      getLastOrderByType,
    };
  }, [scope, scopeAnnotations]);

  return <AnnotationContext.Provider value={value}>{children}</AnnotationContext.Provider>;
};

export const useAnnotationContext = () => {
  const ctx = useContext(AnnotationContext);
  if (!ctx) {
    throw new Error('useAnnotations must be used inside <AnnotationContextProvider>');
  }
  return ctx;
};
