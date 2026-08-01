import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import NotFound from '../../src/components/NotFound';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

jest.mock('react-i18next', () => {
  const original = jest.requireActual('react-i18next');

  return {
    ...original,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

describe('NotFound Component', () => {
  it('renders the 404 page correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      </I18nextProvider>
    );
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('notFound.title')).toBeInTheDocument();
    expect(screen.getByText('notFound.description')).toBeInTheDocument();
    expect(screen.getByText('notFound.backHome')).toBeInTheDocument();
  });
});
