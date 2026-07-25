import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import routes from './routes/index.tsx';
import { APP_CONFIG } from './constants';
import './i18n';

const basename = import.meta.env?.BASE_URL || APP_CONFIG.DEFAULT_BASENAME;
const router = createBrowserRouter(routes, { basename });

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
