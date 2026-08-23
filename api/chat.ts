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
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request body', { status: 400 });
    }

    // Prepend the system prompt to the message history
    const payload = {
      model: 'llama3', // Or whichever model you prefer on Ollama Cloud (e.g. 'llama3.1' or 'mistral')
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      stream: true,
    };

    const apiKey = process.env.OLLAMA_API_KEY;

    if (!apiKey) {
      console.error('OLLAMA_API_KEY is not set');

      return new Response('Server configuration error', { status: 500 });
    }

    // Call Ollama Cloud API (OpenAI compatible endpoint)
    const response = await fetch('https://api.ollama.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Ollama API error:', error);

      return new Response('Error communicating with AI service', { status: 502 });
    }

    // The frontend expects a raw text stream, but Ollama/OpenAI streams SSE JSON.
    // We need to parse the SSE JSON and just stream the raw text tokens back to the client.
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('[DONE]')) continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                controller.enqueue(new TextEncoder().encode(data.choices[0].delta.content));
              }
            } catch {
              // Ignore malformed JSON chunks
            }
          }
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        // Enable CORS for local dev and GitHub Pages
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}
