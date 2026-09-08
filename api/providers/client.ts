import { ProviderConfig, ChatMessagePayload, ProviderCallResult } from './types.js';

export async function callOpenAICompatibleProvider(
    config: ProviderConfig,
    apiKey: string,
    messages: ChatMessagePayload[],
    systemPrompt: string,
    modelOverride?: string
): Promise<ProviderCallResult> {
    const model = modelOverride || config.defaultModel;

    const payload = {
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
        ],
        stream: false,
    };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.authHeader(apiKey),
    };

    try {
        console.info(`[api/providers] Calling ${config.displayName} (${model})...`);
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (response.status === 429) {
            const errorText = await response.text();
            console.warn(`[api/providers] ${config.displayName} rate limit (429):`, errorText);

            return {
                success: false,
                status: 429,
                rateLimited: true,
                error: `${config.displayName} quota or rate limit reached`,
            };
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[api/providers] ${config.displayName} error (${response.status}):`, errorText);

            return {
                success: false,
                status: response.status,
                error: errorText,
            };
        }

        const data = await response.json();
        let content: string = data.choices?.[0]?.message?.content ?? '';

        // Proactively strip wrapping ```markdown code blocks if LLM wrapped whole output
        if (content.startsWith('```markdown\n') && content.endsWith('\n```')) {
            content = content.substring(12, content.length - 4).trim();
        }

        return {
            success: true,
            response: {
                content,
                provider: config.name,
                model,
            },
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[api/providers] Exception calling ${config.displayName}:`, errorMsg);

        return {
            success: false,
            status: 500,
            error: errorMsg,
        };
    }
}
