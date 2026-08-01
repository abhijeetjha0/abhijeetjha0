import { render, screen, fireEvent } from '@testing-library/react';
import Skills from '../../src/components/Skills';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

describe('Skills Component', () => {
  test('renders skills heading and categories', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Skills />
      </I18nextProvider>
    );

    expect(screen.getAllByText(/Programming Languages/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Libraries & Frameworks/i).length).toBeGreaterThan(0);
  });

  test('filters categories when filter buttons are clicked', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Skills />
      </I18nextProvider>
    );

    const languagesFilterBtn = screen.getByRole('button', { name: /Programming Languages/i });
    fireEvent.click(languagesFilterBtn);

    expect(screen.getAllByText(/Programming Languages/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { level: 3, name: /Build Tools/i })).toBeNull();
  });
});
