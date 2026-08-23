import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: '/abhijeetjha0/',
        define: {
            'process.env.VITE_AI_BACKEND_URL': JSON.stringify(env.VITE_AI_BACKEND_URL)
        },
        plugins: [
            react({
                babel: {
                    plugins: [['babel-plugin-react-compiler']],
                },
            }),
        ],
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom', 'react-router'],
                        'vendor-bootstrap': ['react-bootstrap'],
                        'vendor-markdown': ['react-markdown', 'remark-gfm'],
                        'vendor-i18n': ['i18next', 'react-i18next'],
                    },
                },
            },
        },
    };
});
