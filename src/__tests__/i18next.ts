import { vi } from 'vitest';

const tMock = vi.fn((key: string) => key);

export default {
  t: tMock,
  changeLanguage: vi.fn(),
  language: 'fr',
};
