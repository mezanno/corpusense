import { Middleware } from '@reduxjs/toolkit';

function serializeDates(obj: unknown): unknown {
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeDates);
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeDates(value);
    }
    return result;
  }

  return obj;
}

/**
 * Middleware that serializes Date objects in the action payload to ISO strings.
 * @returns
 */
export const dateConverterMiddleware: Middleware = () => (next) => (action: unknown) => {
  // console.log('testMiddleware: action received: ', action);

  if (
    action !== null &&
    typeof action === 'object' &&
    'payload' in action &&
    action.payload !== undefined &&
    action.payload !== null
  ) {
    const newPayload = serializeDates(action.payload);
    // console.log('testMiddleware: serialized payload: ', newPayload);
    return next({
      ...action,
      payload: newPayload,
    });
  }

  return next(action);
};
