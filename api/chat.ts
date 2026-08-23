export const config = {
    runtime: 'edge',
};

// We will construct the system prompt using the portfolio data
const SYSTEM_PROMPT = `You are the AI assistant for Abhijit Kumar Jha's personal portfolio website. 
Your goal is to answer questions about his professional experience, skills, projects, and education based ONLY on the provided information below.
Keep your answers concise, professional, and friendly. Do not hallucinate or make up information not present in the text.
If you don't know the answer, politely state that the user should contact Abhijit directly.

---
PERSONAL INFO
Name: Abhijit Kumar Jha
Title: Senior Software Engineer
Location: Jaipur, India
Email: abhijeetjha0@hotmail.com

ABOUT
Leading UI development and crafting responsive web designs with expertise in React, Ember.js, and TypeScript. Focused on building efficient, high-performance web applications that are localized, accessible, and cross-browser compatible.

EXPERIENCE
1. Senior Software Engineer at Metacube Software Pvt. Ltd. (Apr 2023 - Present)
- Mentored and led a team of 7-10 developers.
- Designed responsive web apps with ReactJS, reducing load times by 30%.
- Developed localized and WCAG accessible pages.
- Used Vite, Webpack, Babel with tree-shaking.
- Wrote Jest-based tests achieving 99% code coverage.
- Established linting standards (ESLint, Stylelint).

2. Software Engineer at Metacube Software Pvt. Ltd. (Jan 2020 - Mar 2023)
- Utilized React and Ember.js for web applications.
- Designed RESTful APIs.
- Worked on SSO applications for a NASDAQ-listed USA client.
- Developed SSO-based Browser extensions (Safari, Chromium, Firefox).

SKILLS
- Frameworks: React, React Router, Jest, Ember.js, jQuery, Bootstrap, Material UI
- Languages: JavaScript, TypeScript, HTML5, CSS3, Sass
- Web Tech: Cross-Browser Development, i18n, WCAG a11y
- AI Skills: AI-Assisted Development, Prompt Engineering
- Build Tools: Vite, Webpack, Babel, Rollup
- Linting: ESLint, Stylelint, SonarQube

EDUCATION
- B.Tech in IT from Swami Keshwanand Institute of Technology, Jaipur (2016-2020)
- Senior School in Science from Rajkiya Pratibha Vikas Vidyalaya, New Delhi (2013-2015)

PROJECTS
1. Poke-Dexter: Pokédex application showcasing modern web development techniques.
2. Personal Portfolio: Built with React, showcasing professional experience.
3. Vaccination Slots Monitor: Monitoring tool to track vaccination slots.
---`;

export default async function handler(req: Request) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            status: 204,
        });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        const { messages, modelsToTry } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response('Invalid request body', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const apiKey = process.env.OLLAMA_API_KEY;

        if (!apiKey) {
            console.error('OLLAMA_API_KEY is not set');

            return new Response('Server configuration error', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const OLLAMA_API = 'https://ollama.com/v1';
        const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };
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
            console.log(`Trying model: ${model}`);

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
            if (response.ok) {
                console.log(`Successfully using model: ${model}`);
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content ?? '';

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
                console.warn(`Model "${model}" requires a subscription, trying next...`);
                continue;
            }

            // For any other error (not subscription), return it immediately
            console.error(`Ollama API error for model "${model}":`, errorText);

            return new Response(`Ollama Cloud Error: ${errorText}`, { status: 502, headers: CORS_HEADERS });
        }

        // If ALL models failed (all require subscriptions)

        return new Response(
            'No free models available on Ollama Cloud. Please check your subscription or try again later.',
            { status: 503, headers: CORS_HEADERS }
        );

    } catch (error) {
        console.error('Chat API Error:', error);

        return new Response('Internal Server Error', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
