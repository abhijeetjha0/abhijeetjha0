import { render, screen } from '@testing-library/react';
import Loader from '../../src/components/Loader';

describe('Loader Component', () => {
  test('renders loading heading text', () => {
    render(<Loader />);

    const heading = screen.getByRole('heading', { level: 1, name: /Loading.../i });
    expect(heading).toBeInTheDocument();
  });
});
