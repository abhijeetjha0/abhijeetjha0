import { FREE_PROVIDERS, getProviderApiKey } from './registry';
import { callOpenAICompatibleProvider } from './client';
import { ChatMessagePayload, ProviderResponse } from './types';

export interface WaterfallResult {
    success: boolean;
    response?: ProviderResponse;
    error?: string;
    attempts: Array<{
        provider: string;
        model: string;
        success: boolean;
        error?: string;
        rateLimited?: boolean;
    }>;
}

export function getConfiguredProviders() {
    return FREE_PROVIDERS.filter(p => Boolean(getProviderApiKey(p)));
}

export async function executeProviderWaterfall(
    messages: ChatMessagePayload[],
    systemPrompt: string,
    preferredProvider?: string
): Promise<WaterfallResult> {
    const configured = getConfiguredProviders();

    if (configured.length === 0) {
        console.error('[api/providers] No AI provider API keys configured in environment variables');

        return {
            success: false,
            error: 'No AI provider is configured. Please configure GITHUB_TOKEN, OPENROUTER_API_KEY, HF_TOKEN, or OLLAMA_API_KEY.',
            attempts: [],
        };
    }

    // Sort: if preferredProvider or process.env.DEFAULT_AI_PROVIDER matches, move it to the front
    const primary = preferredProvider || process.env.DEFAULT_AI_PROVIDER;
    const providersToTry = [...configured].sort((a, b) => {
        if (a.name === primary) return -1;
        if (b.name === primary) return 1;

        return 0;
    });

    const attempts: WaterfallResult['attempts'] = [];

    for (const provider of providersToTry) {
        const apiKey = getProviderApiKey(provider);
        if (!apiKey) {
            continue;
        }

        console.info(`[api/providers] Attempting provider: ${provider.displayName}...`);
        const result = await callOpenAICompatibleProvider(
            provider,
            apiKey,
            messages,
            systemPrompt
        );

        attempts.push({
            provider: provider.name,
            model: provider.defaultModel,
            success: result.success,
            error: result.error,
            rateLimited: result.rateLimited,
        });

        if (result.success && result.response) {
            console.info(`[api/providers] Successfully received response from ${provider.displayName}`);

            return {
                success: true,
                response: result.response,
                attempts,
            };
        }

        console.warn(
            `[api/providers] Provider ${provider.displayName} failed (${result.status || 'unknown'}). Cascading to next available provider...`
        );
    }

    console.error('[api/providers] All configured AI providers failed.');

    return {
        success: false,
        error: 'All available AI providers are currently busy or rate-limited. Please try again in a few moments.',
        attempts,
    };
}

export * from './types';
export * from './registry';
export * from './client';
