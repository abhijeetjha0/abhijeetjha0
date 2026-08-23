export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 204,
    });
  }

  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const apiKey = process.env.OLLAMA_API_KEY;

  if (!apiKey) {
    console.error('OLLAMA_API_KEY is not set');

    return new Response('Server configuration error', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const OLLAMA_API = 'https://ollama.com/v1';
  const AUTH_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  try {
    // 1. Fetch all available models
    const modelsResponse = await fetch(`${OLLAMA_API}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!modelsResponse.ok) {
      throw new Error(`Failed to fetch models: ${await modelsResponse.text()}`);
    }

    const modelsData = await modelsResponse.json();
    const allModels = modelsData?.data?.map((m: { id: string }) => m.id) || [];

    // 2. Test models until we find 3 free ones
    const freeModels: string[] = [];
    
    for (const model of allModels) {
      if (freeModels.length >= 3) break;

      const payload = {
        model,
        messages: [{ role: 'user', content: 'test' }],
        stream: false,
      };

      const response = await fetch(`${OLLAMA_API}/chat/completions`, {
        method: 'POST',
        headers: AUTH_HEADERS,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        freeModels.push(model);
      } else {
        const errorText = await response.text();
        // Stop entirely if unauthorized/invalid key, but ignore subscription errors
        if (response.status === 401 && !errorText.includes('subscription')) {
            throw new Error('API Key Unauthorized');
        }
      }
    }

    if (freeModels.length === 0) {
      return new Response(JSON.stringify({ error: 'No free models available' }), { 
        status: 503, 
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } 
      });
    }

    // 3. Return the array of free models, heavily cached at the Edge
    return new Response(JSON.stringify(freeModels), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        // Cache at edge for 1 hour, serve stale while revalidating
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      }
    });

  } catch (error) {
    console.error('Models API Error:', error);

    return new Response('Internal Server Error', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
