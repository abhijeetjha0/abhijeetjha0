import { CORS_HEADERS, SYSTEM_PROMPT, OLLAMA_API } from './constants';
import { chatRateLimit } from './rateLimit';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                ...CORS_HEADERS,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            status: 204,
        });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
        console.info(`[api/chat] Received POST request to /api/chat`);

        const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
        if (chatRateLimit) {
            const { success } = await chatRateLimit.limit(ip);
            if (!success) {
                console.warn(`[api/chat] Rate limit exceeded for IP: ${ip}`);

                return new Response('Too Many Requests', { status: 429, headers: CORS_HEADERS });
            }
        }

        const { messages, modelsToTry } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response('Invalid request body', { status: 400, headers: CORS_HEADERS });
        }

        const apiKey = process.env.OLLAMA_API_KEY;

        if (!apiKey) {
            console.error('OLLAMA_API_KEY is not set');

            return new Response('Server configuration error', { status: 500, headers: CORS_HEADERS });
        }

        const AUTH_HEADERS = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        };

        // 1. Use the models provided by the frontend, or fall back to defaults
        const models = Array.isArray(modelsToTry) && modelsToTry.length > 0
            ? modelsToTry
            : ['gemma4:31b', 'gpt-oss:20b', 'minimax-m2.7'];

        // 2. Try each model until one works (skip subscription-required models)
        for (const model of models) {
            console.info(`[api/chat] Trying model: ${model}...`);
            console.time(`ollama-request-${model}`);

            const payload = {
                model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...messages
                ],
                stream: false,
            };

            const response = await fetch(`${OLLAMA_API}/chat/completions`, {
                method: 'POST',
                headers: AUTH_HEADERS,
                body: JSON.stringify(payload),
            });

            // If the model works, return the full response instantly
            console.timeEnd(`ollama-request-${model}`);

            if (response.ok) {
                console.info(`[api/chat] Successfully received response from model: ${model}`);
                const data = await response.json();
                let content = data.choices?.[0]?.message?.content ?? '';

                // Strip ```markdown wrapper if the LLM wrapped the entire response
                if (content.startsWith('```markdown\n') && content.endsWith('\n```')) {
                    content = content.substring(12, content.length - 4).trim();
                }

                return new Response(content, {
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        ...CORS_HEADERS,
                    }
                });
            }

            // If the model requires a subscription, skip it and try the next one
            const errorText = await response.text();
            if (errorText.includes('subscription')) {
                console.warn(`[api/chat] Model "${model}" requires a subscription, trying next...`);
                continue;
            }

            // For any other error (not subscription), return it immediately
            console.error(`Ollama API error for model "${model}":`, errorText);

            return new Response(`Ollama Cloud Error: ${errorText}`, { status: 502, headers: CORS_HEADERS });
        }

        // If ALL models failed (all require subscriptions)
        console.error(`[api/chat] All attempted models failed or required subscriptions.`);

        return new Response(
            'No free models available on Ollama Cloud. Please check your subscription or try again later.',
            { status: 503, headers: CORS_HEADERS }
        );

    } catch (error) {
        console.error('Chat API Error:', error);

        return new Response('Internal Server Error', { status: 500, headers: CORS_HEADERS });
    }
}
