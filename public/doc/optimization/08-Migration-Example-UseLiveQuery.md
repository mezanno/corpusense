# Exemple de Migration : De Redux vers useLiveQuery

Ce document détaille les étapes pour migrer la page `CollectionsManagerPage` d'une gestion d'état Redux vers une gestion réactive locale avec `useLiveQuery` (Dexie), tout en respectant l'architecture existante (DAL).

## Objectif
Remplacer `useAppSelector(selectCollections)` et `dispatch(removeCollectionRequest(id))` par un hook personnalisé `useCollections` qui interagit directement avec la base de données locale de manière réactive.

## Étape 1 : Création du Hook Personnalisé

Nous allons créer un hook `useCollections` qui encapsule la logique de lecture (via `useLiveQuery`) et d'écriture (via le Repository existant).

**Fichier suggéré :** `src/hooks/data/useCollections.ts`

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/data/repositories/indexeddb/db';
import { getCollectionRepository } from '@/data/repositories/indexeddb/dbFactory';
import { CollectionDetails } from '@/data/models/Collection';

export const useCollections = () => {
  // 1. Lecture Réactive : S'abonne aux changements de la table 'collections'
  // Dexie détecte automatiquement les dépendances et re-render le composant
  // si une collection est ajoutée, modifiée ou supprimée.
  const collections = useLiveQuery(
    () => db.collections.toArray(),
    [], // Dépendances du hook (vide ici car on veut tout)
    [] as CollectionDetails[] // Valeur par défaut pendant le chargement
  );

  // 2. Actions : Fonctions pour modifier les données via le Repository (DAL)
  const removeCollection = async (id: string) => {
    const repository = getCollectionRepository();
    
    // On récupère l'objet complet car la méthode delete du repo attend une Collection
    // (même si elle n'utilise que l'ID en interne, c'est plus sûr pour le typage)
    try {
      const collection = await repository.getById(id);
      await repository.delete(collection);
    } catch (error) {
      console.error("Erreur lors de la suppression de la collection", error);
      // Ici, on pourrait ajouter une gestion d'erreur plus fine (toast, etc.)
    }
  };

  return {
    collections: collections ?? [], // Sécurité null/undefined
    removeCollection,
    isLoading: collections === undefined
  };
};
```

## Étape 2 : Mise à jour du Composant Page

Nous allons modifier `CollectionsManagerPage.tsx` pour utiliser ce nouveau hook.

**Fichier :** `src/pages/CollectionsManagerPage.tsx`

```tsx
// ... imports existants
// Retirer : import { removeCollectionRequest } from '@/state/reducers/collections';
// Retirer : import { selectCollections } from '@/state/selectors/collections';
// Ajouter :
import { useCollections } from '@/hooks/data/useCollections';

// ... (Le composant CollectionTableRow doit aussi être adapté ou recevoir la fonction de suppression en prop)

const CollectionTableRow = ({
  collection,
  addOrRemoveCollection,
  onDelete, // Nouvelle prop pour éviter de passer dispatch
}: {
  collection: CollectionDetails;
  addOrRemoveCollection: (collectionId: string, isAdd: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  // ...
  // Retirer : const dispatch = useAppDispatch();
  
  const handleDelete = (id: string) => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_collection'),
      onConfirm: {
        message: t('btn_yes'),
        // Utilisation de la fonction passée en prop
        action: () => onDelete(id),
      },
    });
  };

  // ... reste du code
};

const CollectionsManagerPage = () => {
  const { t } = useTranslation();
  
  // Remplacement de Redux par le hook custom
  // const collections: CollectionDetails[] = useAppSelector(selectCollections);
  const { collections, removeCollection } = useCollections();
  
  // ... reste du code (dialogs, state local)

  return (
    <div className='panel flex-col items-center space-y-4'>
      {/* ... boutons ... */}

      {collections.length > 0 ? (
        <section className='flex h-full w-4/5 flex-col items-center space-y-1'>
          {/* ... header table ... */}
          <TableBody>
            {collections.map((col) => (
              <CollectionTableRow
                collection={col}
                key={col.id}
                addOrRemoveCollection={addOrRemoveCollection}
                onDelete={removeCollection} // On passe la fonction ici
              />
            ))}
          </TableBody>
          {/* ... footer ... */}
        </section>
      ) : (
        // ... empty state
      )}
    </div>
  );
};

export default CollectionsManagerPage;
```

## Avantages de cette approche

1.  **Réactivité Native** : Plus besoin de dispatcher une action `LOAD_COLLECTIONS` ou de gérer un état `isLoaded` dans Redux. Si un Worker en arrière-plan ajoute une collection, la liste se met à jour instantanément.
2.  **Simplification** : On supprime la dépendance à Redux, aux Sagas et aux Sélecteurs pour cette fonctionnalité.
3.  **Cohérence** : On réutilise `IndexedDBCollectionRepository` pour la logique métier (suppression en cascade), garantissant que les règles de gestion sont respectées.
4.  **Performance** : `useLiveQuery` est optimisé pour ne re-rendre le composant que si le résultat de la requête change.
