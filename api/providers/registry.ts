import { ProviderConfig } from './types.js';

export const FREE_PROVIDERS: ProviderConfig[] = [
    {
        name: 'openrouter',
        displayName: 'OpenRouter Free Tier',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKeyEnv: 'OPENROUTER_API_KEY',
        defaultModel: 'openrouter/free',
        authHeader: (key: string) => ({
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': 'https://abhijeetjha0.github.io/abhijeetjha0/',
            'X-Title': 'Abhijit Kumar Jha Portfolio Assistant',
        }),
    },
    {
        name: 'opencode_zen',
        displayName: 'OpenCode Zen',
        endpoint: 'https://opencode.ai/zen/v1/chat/completions',
        apiKeyEnv: 'OPENCODE_ZEN_API_KEY',
        defaultModel: 'glm-5.3-flash-free',
        authHeader: (key: string) => ({
            Authorization: `Bearer ${key}`,
        }),
    },
    {
        name: 'ollama',
        displayName: 'Ollama Cloud',
        endpoint: 'https://ollama.com/v1/chat/completions',
        apiKeyEnv: 'OLLAMA_API_KEY',
        defaultModel: 'gemma4:31b',
        authHeader: (key: string) => ({
            Authorization: `Bearer ${key}`,
        }),
    },
    {
        name: 'huggingface',
        displayName: 'Hugging Face Inference',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        apiKeyEnv: 'HF_TOKEN',
        defaultModel: 'Qwen/Qwen3.8-27B:ovhcloud',
        authHeader: (key: string) => ({
            Authorization: `Bearer ${key}`,
        }),
    },
];

export function getProviderApiKey(config: ProviderConfig): string | undefined {
    // Check primary env var
    const key = process.env[config.apiKeyEnv];
    if (key) {
        return key;
    }

    // Secondary fallback alias env vars
    if (config.name === 'huggingface') {
        return process.env.HUGGINGFACE_API_KEY;
    }

    if (config.name === 'opencode_zen') {
        return process.env.OPENCODE_API_KEY;
    }

    return undefined;
}

let dynamicHfFreeModels: string[] = [];

export function setDynamicFreeHuggingFaceModels(models: string[]): void {
    if (Array.isArray(models)) {
        dynamicHfFreeModels = models;
    }
}

export function getDynamicFreeHuggingFaceModels(): string[] {
    return dynamicHfFreeModels;
}

export function isFreeHuggingFaceModel(model: string): boolean {
    if (!model || typeof model !== 'string') {
        return false;
    }

    const trimmed = model.trim();

    return dynamicHfFreeModels.includes(trimmed) ||
        trimmed === 'Qwen/Qwen3.8-27B:ovhcloud' ||
        trimmed === 'Qwen/Qwen3.8-27B';
}

export function isOpenCodeFreeModel(model: string): boolean {
    if (!model || typeof model !== 'string') {
        return false;
    }

    return model.trim().endsWith('-free');
}


