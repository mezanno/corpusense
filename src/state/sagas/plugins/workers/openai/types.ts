interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: {
    type: 'json_object' | 'text';
  };
}

export interface LLMResponse {
  content: string;
}

export interface LLMClient {
  complete(request: LLMRequest): Promise<LLMResponse>;
}
