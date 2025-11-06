// global.d.ts
declare global {
  interface MatchMedia {
    matches: boolean;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  }

  // Déclarez une signature d'index pour globalThis
  interface Global {
    [key: string]: any; // Permet d'ajouter dynamiquement des propriétés
    matchMedia?: (query: string) => MatchMedia;
  }

  var globalThis: Global;
}

export {};
