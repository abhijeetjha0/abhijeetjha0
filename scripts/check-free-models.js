import fs from 'fs';
import https from 'https';

// Simple polyfill for fetch in older Node versions, or use native fetch in Node 18+
const fetchUrl = async (url, options = {}) => {
    if (typeof fetch !== 'undefined') {
        return fetch(url, options);
    }

    // Fallback for Node < 18 if fetch is not available globally
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: async () => JSON.parse(data),
                    text: async () => data,
                });
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
};

async function main() {
    console.log('--- Ollama Cloud Free Tier Checker ---');
  
    // 1. Read API Key from .env.local
    let apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) {
        try {
            const envFile = fs.readFileSync('.env.local', 'utf8');
            const match = envFile.match(/OLLAMA_API_KEY=["']?([^"'\n]+)["']?/);
            if (match) {
                apiKey = match[1];
            }
        } catch (e) {
            console.error('Could not read .env.local file. Please run this from the project root.');
            process.exit(1);
        }
    }

    if (!apiKey) {
        console.error('OLLAMA_API_KEY not found in .env.local');
        process.exit(1);
    }

    console.log('API Key found. Fetching models list...');

    const OLLAMA_API = 'https://ollama.com/v1';
    const AUTH_HEADERS = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    // 2. Fetch Models
    let models = [];
    try {
        const res = await fetchUrl(`${OLLAMA_API}/models`, { headers: AUTH_HEADERS });
        if (!res.ok) {
            console.error('Failed to fetch models:', await res.text());
            process.exit(1);
        }
        const data = await res.json();
        models = data.data.map(m => m.id);
    } catch (e) {
        console.error('Error fetching models:', e.message);
        process.exit(1);
    }

    console.log(`Found ${models.length} models. Checking which ones are free...\n`);

    const freeModels = [];
    const paidModels = [];

    // 3. Test Each Model
    for (const model of models) {
        process.stdout.write(`Testing ${model}... `);
    
        const payload = {
            model,
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
        };

        try {
            const res = await fetchUrl(`${OLLAMA_API}/chat/completions`, {
                method: 'POST',
                headers: AUTH_HEADERS,
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                console.log('\x1b[32m[FREE]\x1b[0m');
                freeModels.push(model);
            } else {
                const errText = await res.text();
                if (errText.includes('subscription')) {
                    console.log('\x1b[33m[PAID]\x1b[0m');
                    paidModels.push(model);
                } else {
                    console.log(`\x1b[31m[ERROR]\x1b[0m (${res.status}): ${errText}`);
                }
            }
        } catch (e) {
            console.log(`\x1b[31m[FAILED]\x1b[0m ${e.message}`);
        }
    
        // Tiny delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
    }

    // 4. Summary
    console.log('\n--- Summary ---');
    console.log(`\x1b[32mFree Models (${freeModels.length}):\x1b[0m`);
    freeModels.forEach(m => console.log(`  - ${m}`));
  
    console.log(`\n\x1b[33mPaid Models (${paidModels.length}):\x1b[0m`);
    paidModels.forEach(m => console.log(`  - ${m}`));
}

main();
