import { vi } from 'vitest';

const tMock = vi.fn((key) => `${key}`);

export const useTranslation = () => ({
  t: tMock,
  i18n: {
    changeLanguage: vi.fn(() => Promise.resolve()),
    language: 'fr',
  },
});
