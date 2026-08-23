import { render, screen } from '@testing-library/react';
import Loader from '../../src/components/Loader';

jest.mock('react-i18next', () => {
    const original = jest.requireActual('react-i18next');

    return {
        ...original,
        useTranslation: () => ({
            t: (key: string) => key,
        }),
    };
});

describe('Loader Component', () => {
    test('renders loading heading text', () => {
        render(<Loader />);

        const heading = screen.getByRole('heading', { level: 1, name: /loading/i });
        expect(heading).toBeInTheDocument();
    });
});
