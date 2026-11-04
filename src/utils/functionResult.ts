// src/utils/result.ts
import { BaseError } from '@/utils/BaseError';

export type FunctionResult<T, E = BaseError> = { ok: true; value: T } | { ok: false; error: E };

export const FunctionResult = {
  // Constructeurs
  ok: <T>(value: T): FunctionResult<T, never> => ({ ok: true, value }),
  err: <E>(error: E): FunctionResult<never, E> => ({ ok: false, error }),

  // Transforme la valeur si OK
  map: <T, U, E>(result: FunctionResult<T, E>, fn: (val: T) => U): FunctionResult<U, E> =>
    result.ok ? FunctionResult.ok(fn(result.value)) : result,

  // Chaîne une autre opération qui renvoie un FunctionResult (flatMap)
  flatMap: <T, U, E1, E2>(
    result: FunctionResult<T, E1>,
    fn: (value: T) => FunctionResult<U, E2>,
  ): FunctionResult<U, E1 | E2> => (result.ok ? fn(result.value) : result),

  // Extrait la valeur ou renvoie une valeur par défaut en cas d'erreur
  unwrapOr: <T, E>(result: FunctionResult<T, E>, fallback: T): T =>
    result.ok ? result.value : fallback,

  // Pattern matching pour exécuter un callback selon le résultat
  match: <T, E, R>(
    result: FunctionResult<T, E>,
    handlers: { ok: (value: T) => R; err: (error: E) => R },
  ): R => (result.ok ? handlers.ok(result.value) : handlers.err(result.error)),

  // Enrobe une Promise/fonction async pour capturer les exceptions inattendues
  fromPromise: async <T, E = BaseError>(
    promise: Promise<T>,
    onError: (error: unknown) => E,
  ): Promise<FunctionResult<T, E>> => {
    try {
      const data = await promise;
      return FunctionResult.ok(data);
    } catch (e) {
      return FunctionResult.err(onError(e));
    }
  },
};
