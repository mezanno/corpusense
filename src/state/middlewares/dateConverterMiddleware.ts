import { Middleware } from '@reduxjs/toolkit';

/**
 * Vérifie si une valeur est une string ISO 8601 (date)
 */
const isISODateString = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);

/**
 * Convertit les objets `Date` en string ISO, récursivement
 */
function serializeDates<T>(obj: T): T {
  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  } else if (Array.isArray(obj)) {
    return obj.map(serializeDates) as unknown as T;
  } else if (obj !== null && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const entries = Object.entries(obj).map(([key, value]) => [key, serializeDates(value)]);
    return Object.fromEntries(entries) as T;
  }
  return obj;
}

/**
 * Convertit les string ISO en `Date`, récursivement
 */
function reviveDates<T>(obj: T): T {
  if (isISODateString(obj)) {
    return new Date(obj) as unknown as T;
  } else if (Array.isArray(obj)) {
    return obj.map(reviveDates) as unknown as T;
  } else if (obj !== null && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const entries = Object.entries(obj).map(([key, value]) => [key, reviveDates(value)]);
    return Object.fromEntries(entries) as T;
  }
  return obj;
}

/**
 * Middleware Redux pour transformer Date <-> string ISO dans les payloads
 */
export const dateConverterMiddleware: Middleware = () => (next) => (action: unknown) => {
  if (
    typeof action === 'object' &&
    action !== null &&
    'payload' in action &&
    action?.payload !== undefined
  ) {
    action.payload = reviveDates(action.payload);
  }

  const result = next(action);

  if (
    typeof action === 'object' &&
    action !== null &&
    'payload' in action &&
    action?.payload !== undefined
  ) {
    action.payload = serializeDates(action.payload);
  }

  return result;
};
