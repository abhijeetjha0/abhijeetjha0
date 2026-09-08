import { ProviderConfig } from './types.js';

export const FREE_PROVIDERS: ProviderConfig[] = [
    {
        name: 'openrouter',
        displayName: 'OpenRouter Free Tier',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKeyEnv: 'OPENROUTER_API_KEY',
        defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
        authHeader: (key: string) => ({
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': 'https://abhijeetjha0.github.io/abhijeetjha0/',
            'X-Title': 'Abhijit Kumar Jha Portfolio Assistant',
        }),
    },
    {
        name: 'huggingface',
        displayName: 'Hugging Face Inference',
        endpoint: 'https://router.huggingface.co/v1/chat/completions',
        apiKeyEnv: 'HF_TOKEN',
        defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
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

    return undefined;
}
