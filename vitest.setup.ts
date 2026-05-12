import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, expect, vi } from 'vitest';

import 'vitest-webgl-canvas-mock'; //nécessaire pour pouvoir tester Annotorious qui utilise WebGL

expect.extend(matchers);

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

//Nécessaire pour que le hook use-mobile.ts (généré par shadcn ui) fonctionne correctement dans les tests
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // legacy
    removeListener: vi.fn(), // legacy
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);

//Nécessaire pour faire fonctionner Annotorious
/* tslint:disable-next-line */
// global.ResizeObserver = class {
//   observe() {}
//   unobserve() {}
//   disconnect() {}
// };

vi.mock('@/utils/config', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// globalThis.HTMLCanvasElement.prototype.getContext = () => ({
//   // Simule une partie de l'interface WebGLRenderingContext
//   getAttribLocation: () => 1,
//   createBuffer: () => ({}),
//   bindBuffer: () => {},
//   bufferData: () => {},
//   drawArrays: () => {},
//   // Ajoute d'autres méthodes si nécessaire pour ton test
// });

vi.mock('@samvera/clover-iiif/primitives', () => ({
  Label: ({ label }: { label: unknown }) =>
    React.createElement('div', { 'data-testid': 'clover-label' }, JSON.stringify(label)),
  Metadata: ({ metadata }: { metadata: unknown }) =>
    React.createElement('div', { 'data-testid': 'clover-metadata' }, JSON.stringify(metadata)),
  Summary: ({ summary }: { summary: unknown }) =>
    React.createElement('div', { 'data-testid': 'clover-summary' }, JSON.stringify(summary)),
  Thumbnail: () => React.createElement('div', { 'data-testid': 'clover-thumbnail' }),
}));

console.log('vitest.setup.ts loaded');
