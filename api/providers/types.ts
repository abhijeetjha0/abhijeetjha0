export type FreeProviderName = 'github' | 'openrouter' | 'huggingface' | 'ollama';

export interface ProviderConfig {
    name: FreeProviderName;
    displayName: string;
    endpoint: string;
    apiKeyEnv: string;
    defaultModel: string;
    authHeader: (key: string) => Record<string, string>;
}

export interface ChatMessagePayload {
    role: string;
    content: string;
}

export interface ProviderResponse {
    content: string;
    provider: FreeProviderName;
    model: string;
}

export interface ProviderCallResult {
    success: boolean;
    response?: ProviderResponse;
    status?: number;
    error?: string;
    rateLimited?: boolean;
}
