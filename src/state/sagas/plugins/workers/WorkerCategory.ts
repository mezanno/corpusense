export const WorkerCategory = {
  LAYOUT: 'layout',
  OCR: 'ocr',
  LLM: 'llm',
  OTHER: 'other',
} as const;

export type WorkerCategory = (typeof WorkerCategory)[keyof typeof WorkerCategory];
