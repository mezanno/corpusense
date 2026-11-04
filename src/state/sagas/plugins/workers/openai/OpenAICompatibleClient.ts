import { z } from 'zod';

import { BaseError } from '@/utils/BaseError';

import { LLMClient, LLMRequest, LLMResponse } from './types';

interface OpenAICompatibleClientOptions {
  apiKey: string;
  baseURL: string;

  /**
   * Nombre maximum de tentatives HTTP.
   *
   * 1 = aucun retry
   * 2 = 1 retry
   * 3 = 2 retries
   */
  maxAttempts?: number;

  /**
   * Délai initial entre les tentatives, en ms.
   */
  initialRetryDelay?: number;

  /**
   * Délai maximum entre les tentatives, en ms.
   */
  maxRetryDelay?: number;

  /**
   * Temps maximum sans recevoir de données du serveur.
   *
   * Ce timeout s'applique également à l'attente du premier chunk.
   *
   * Exemple :
   *   60_000 = 60 secondes maximum sans activité.
   *
   * La génération totale peut donc durer plusieurs minutes
   * tant que le serveur continue à envoyer des données.
   */
  inactivityTimeout?: number;
}

const OpenAIErrorResponseSchema = z.object({
  error: z
    .object({
      message: z.string().optional(),
      type: z.string().optional(),
      code: z.union([z.string(), z.number()]).optional(),
      param: z.string().nullable().optional(),
    })
    .optional(),
});

const OpenAIChatCompletionChunkSchema = z.object({
  id: z.string().optional(),
  object: z.string().optional(),
  created: z.number().optional(),
  model: z.string().optional(),
  choices: z
    .array(
      z.object({
        index: z.number().optional(),
        delta: z
          .object({
            role: z.string().optional(),
            content: z.string().nullable().optional(),
          })
          .optional(),
        finish_reason: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

type OpenAIChatCompletionChunk = z.infer<typeof OpenAIChatCompletionChunkSchema>;

export class OpenAICompatibleClient implements LLMClient {
  private readonly apiKey: string;
  private readonly baseURL: string;

  private readonly maxAttempts: number;
  private readonly initialRetryDelay: number;
  private readonly maxRetryDelay: number;
  private readonly inactivityTimeout: number;

  constructor(options: OpenAICompatibleClientOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL.replace(/\/+$/, '');

    this.maxAttempts = options.maxAttempts ?? 3;
    this.initialRetryDelay = options.initialRetryDelay ?? 500;
    this.maxRetryDelay = options.maxRetryDelay ?? 30_000;

    /**
     * 60 secondes sans aucune donnée.
     *
     * Ce n'est PAS une durée maximale de génération.
     */
    this.inactivityTimeout = options.inactivityTimeout ?? 60_000;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    let attempt = 0;

    while (true) {
      try {
        return await this.executeRequest(request);
      } catch (error) {
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        const delay = this.getRetryDelay(attempt);

        console.warn(
          `LLM request failed. Retrying in ${delay}ms ` +
            `(attempt ${attempt + 2}/${this.maxAttempts})`,
          error,
        );

        await this.sleep(delay);

        attempt++;
      }
    }
  }

  private async executeRequest(request: LLMRequest): Promise<LLMResponse> {
    const controller = new AbortController();

    let inactivityTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const resetInactivityTimeout = () => {
      if (inactivityTimeoutId !== undefined) {
        clearTimeout(inactivityTimeoutId);
      }

      inactivityTimeoutId = setTimeout(() => {
        controller.abort();
      }, this.inactivityTimeout);
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'text/event-stream',
        },

        body: JSON.stringify({
          model: request.model,
          messages: request.messages,

          ...(request.temperature !== undefined && {
            temperature: request.temperature,
          }),

          ...(request.maxTokens !== undefined && {
            max_tokens: request.maxTokens,
          }),

          ...(request.responseFormat !== undefined && {
            response_format: request.responseFormat,
          }),

          /**
           * On utilise le streaming en interne.
           *
           * L'interface LLMClient reste non-streaming :
           * complete() retourne toujours un LLMResponse complet.
           */
          stream: true,
        }),

        signal: controller.signal,
      });

      if (!response.ok) {
        throw await this.createHttpError(response);
      }

      if (response.body === null) {
        throw new LLMRequestError('LLM API returned an empty response body', {
          status: response.status,
          retryable: true,
        });
      }

      resetInactivityTimeout();

      return await this.parseStream(response.body, resetInactivityTimeout, controller.signal);
    } catch (error) {
      if (controller.signal.aborted) {
        throw new LLMRequestError(
          `LLM request timed out after ${this.inactivityTimeout}ms without receiving data`,
          {
            retryable: true,
            cause: error,
          },
        );
      }

      throw error;
    } finally {
      if (inactivityTimeoutId !== undefined) {
        clearTimeout(inactivityTimeoutId);
      }
    }
  }

  private async parseStream(
    body: ReadableStream<Uint8Array>,
    onData: () => void,
    signal: AbortSignal,
  ): Promise<LLMResponse> {
    const reader = body.getReader();
    const decoder = new TextDecoder();

    const contentChunks: string[] = [];

    let buffer = '';
    let receivedDone = false;

    try {
      while (!receivedDone) {
        if (signal.aborted) {
          throw new LLMRequestError('LLM request was aborted', {
            retryable: true,
          });
        }

        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        onData();

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = this.extractSSEEvents(buffer);

        buffer = events.remaining;

        for (const event of events.events) {
          if (event === '[DONE]') {
            receivedDone = true;
            break;
          }

          if (!event.trim()) {
            continue;
          }

          const chunk = this.parseStreamChunk(event);

          const content = chunk.choices?.[0]?.delta?.content;

          if (typeof content === 'string') {
            contentChunks.push(content);
          }
        }
      }

      /**
       * Il peut rester des données dans le decoder.
       */
      buffer += decoder.decode();

      if (!receivedDone && buffer.trim()) {
        const events = this.extractSSEEvents(buffer);

        for (const event of events.events) {
          if (event === '[DONE]') {
            continue;
          }

          if (!event.trim()) {
            continue;
          }

          const chunk = this.parseStreamChunk(event);

          const content = chunk.choices?.[0]?.delta?.content;

          if (typeof content === 'string') {
            contentChunks.push(content);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const content = contentChunks.join('');

    if (!content) {
      throw new LLMResponseError('LLM returned an empty response');
    }

    return {
      content,
    };
  }

  /**
   * Parse les événements Server-Sent Events.
   *
   * Exemple :
   *
   * data: {"choices":[...]}
   *
   * data: {"choices":[...]}
   *
   * data: [DONE]
   *
   * On conserve volontairement les événements incomplets
   * dans `remaining`.
   */
  private extractSSEEvents(buffer: string): {
    events: string[];
    remaining: string;
  } {
    const events: string[] = [];

    /**
     * SSE utilise une ligne vide pour terminer un événement.
     *
     * On accepte :
     *
     * \n\n
     * \r\n\r\n
     */
    const normalized = buffer.replace(/\r\n/g, '\n');

    const parts = normalized.split('\n\n');

    const remaining = parts.pop() ?? '';

    for (const part of parts) {
      const lines = part.split('\n');

      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }

      if (dataLines.length === 0) {
        continue;
      }

      events.push(dataLines.join('\n'));
    }

    return {
      events,
      remaining,
    };
  }

  private parseStreamChunk(event: string): OpenAIChatCompletionChunk {
    let parsed: unknown;

    try {
      parsed = JSON.parse(event);
    } catch (error) {
      throw new LLMResponseError(`LLM returned an invalid SSE JSON chunk: ${event}`);
    }

    const validation = OpenAIChatCompletionChunkSchema.safeParse(parsed);

    if (!validation.success) {
      throw new LLMResponseError(
        `LLM returned an invalid streaming response: ${validation.error.message}`,
      );
    }

    return validation.data;
  }

  private async createHttpError(response: Response): Promise<LLMRequestError> {
    let errorMessage = `LLM API request failed with status ${response.status}`;

    try {
      const errorData = OpenAIErrorResponseSchema.parse(await response.json());

      if (errorData.error?.message !== undefined) {
        errorMessage += `: ${errorData.error.message}`;
      }

      return new LLMRequestError(errorMessage, {
        status: response.status,
        code: errorData.error?.code,
        type: errorData.error?.type,
        retryable: this.isRetryableStatus(response.status),
      });
    } catch {
      return new LLMRequestError(errorMessage, {
        status: response.status,
        retryable: this.isRetryableStatus(response.status),
      });
    }
  }

  private shouldRetry(error: unknown, attempt: number): boolean {
    /**
     * attempt est zero-based.
     *
     * maxAttempts = 1
     *   → attempt 0
     *   → aucun retry
     *
     * maxAttempts = 3
     *   → attempt 0
     *   → retry
     *   → attempt 1
     *   → retry
     *   → attempt 2
     *   → stop
     */
    if (attempt + 1 >= this.maxAttempts) {
      return false;
    }

    if (error instanceof LLMRequestError) {
      return error.retryable;
    }

    /**
     * Les erreurs réseau de fetch sont généralement des TypeError.
     */
    if (error instanceof TypeError) {
      return true;
    }

    return false;
  }

  private isRetryableStatus(status: number): boolean {
    /**
     * 408 Request Timeout
     * 409 Conflict
     * 429 Too Many Requests
     * 500 Internal Server Error
     * 502 Bad Gateway
     * 503 Service Unavailable
     * 504 Gateway Timeout
     */
    return (
      status === 408 ||
      status === 409 ||
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504
    );
  }

  private getRetryDelay(attempt: number): number {
    const exponentialDelay = this.initialRetryDelay * Math.pow(1.5, attempt);

    return Math.min(exponentialDelay, this.maxRetryDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

/**
 * Erreurs du client LLM : elles prolongent `BaseError` pour que le boundary des workers
 * (sagas/workers.ts) lise le même vocabulaire que les erreurs des importers, et retrouve
 * dans `context` le statut HTTP et le code renvoyés par l'API.
 */
export class LLMRequestError extends BaseError {
  readonly status?: number;
  readonly code?: string | number;
  readonly type?: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string | number;
      type?: string;
      retryable?: boolean;
      cause?: unknown;
    } = {},
  ) {
    const { status, code, type, retryable = false } = options;

    super(message, {
      cause: options.cause,
      context: { status, code, type, retryable },
    });

    this.name = 'LLMRequestError';

    this.status = status;
    this.code = code;
    this.type = type;
    this.retryable = retryable;
  }
}

class LLMResponseError extends BaseError {
  constructor(message: string) {
    super(message);

    this.name = 'LLMResponseError';
  }
}
