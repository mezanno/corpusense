import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

import 'vitest-webgl-canvas-mock'; //nécessaire pour pouvoir tester Annotorious qui utilise WebGL

expect.extend(matchers);

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

//Nécessaire pour que le hook use-mobile.ts (généré par shadcn ui) fonctionne correctement dans les tests
globalThis.matchMedia =
  globalThis.matchMedia ||
  (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

//Nécessaire pour faire fonctionner Annotorious
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// globalThis.HTMLCanvasElement.prototype.getContext = () => ({
//   // Simule une partie de l'interface WebGLRenderingContext
//   getAttribLocation: () => 1,
//   createBuffer: () => ({}),
//   bindBuffer: () => {},
//   bufferData: () => {},
//   drawArrays: () => {},
//   // Ajoute d'autres méthodes si nécessaire pour ton test
// });
