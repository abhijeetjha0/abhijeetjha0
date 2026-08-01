import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../src/components/ErrorBoundary';

jest.mock('react-i18next', () => {
  const original = jest.requireActual('react-i18next');

  return {
    ...original,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

describe('ErrorBoundary Component', () => {
  test('renders heading with expected error text', () => {
    render(<ErrorBoundary />);

    const heading = screen.getByRole('heading', { level: 1, name: /errorBoundary/i });
    expect(heading).toBeDefined();
  });
});
