import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import Layout from '../../src/Layout';

describe('Layout Component', () => {
  test('renders NavigationBar and Outlet child content within main container', () => {
    const routes = [
      {
        path: '/',
        Component: Layout,
        children: [
          {
            index: true,
            Component: () => <div>Test Child Component</div>,
          },
        ],
      },
    ];

    const router = createMemoryRouter(routes, { initialEntries: ['/'] });

    render(
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    );

    expect(screen.getByText('Abhijit Kumar Jha')).toBeInTheDocument();
    expect(screen.getByText('Test Child Component')).toBeInTheDocument();
  });
});
