import React from 'react';
import { vi } from 'vitest';

const tMock = vi.fn((key) => `${key}`);

// Renders the raw key (like t does), interpolating <strong> placeholders from `components`
export const Trans = ({
  i18nKey,
  components,
}: {
  i18nKey?: string;
  components?: Record<string, React.ReactElement>;
}) => {
  const match = components ? Object.keys(components)[0] : undefined;
  const key = i18nKey ?? '';
  if (match !== undefined && key.includes(`<${match}>`)) {
    const [before, rest] = key.split(`<${match}>`, 2);
    const [, after] = rest.split(`</${match}>`, 2);
    return React.createElement(
      React.Fragment,
      null,
      before,
      React.cloneElement(components![match], { key: 'child' }, after),
    );
  }
  return React.createElement(React.Fragment, null, key);
};

export const useTranslation = () => ({
  t: tMock,
  i18n: {
    changeLanguage: vi.fn(() => Promise.resolve()),
    language: 'fr',
  },
});
