import { syncFreeModels } from '../providers/sync.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Secure Cron endpoint with CRON_SECRET if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            console.warn('[api/cron/sync-models] Unauthorized cron attempt');

            return new Response('Unauthorized', { status: 401 });
        }
    }

    try {
        console.info('[api/cron/sync-models] Triggering scheduled free models cache refresh...');
        const result = await syncFreeModels(true);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Free models cache refreshed successfully',
                source: result.source,
                models: result.models,
                hfFreeModelsCount: result.hfFreeModels.length,
                ollamaModelsCount: result.ollamaModels.length,
                timestamp: Date.now(),
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        console.error('[api/cron/sync-models] Cron execution error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Internal Server Error',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}
