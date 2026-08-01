import { render, screen, fireEvent } from '@testing-library/react';
import NavigationBar from '../../src/components/NavigationBar';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';

jest.mock('react-i18next', () => {
  const original = jest.requireActual('react-i18next');

  return {
    ...original,
    useTranslation: jest.fn().mockImplementation(original.useTranslation),
  };
});

describe('NavigationBar Component', () => {
  const actualUseTranslation = jest.requireActual('react-i18next').useTranslation;

  beforeEach(() => {
    (useTranslation as jest.Mock).mockImplementation(actualUseTranslation);
  });

  test('renders brand name and navigation links with correct href attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <NavigationBar />
      </I18nextProvider>
    );

    // Brand link
    const brandLink = screen.getByText('Abhijit Kumar Jha');
    expect(brandLink).toBeDefined();
    expect(brandLink.getAttribute('href')).toBe('#home');

    // Section links
    const expLink = screen.getByText('Professional Experience');
    expect(expLink).toBeDefined();
    expect(expLink.getAttribute('href')).toBe('#experience');

    const skillsLink = screen.getByText('Skills');
    expect(skillsLink).toBeDefined();
    expect(skillsLink.getAttribute('href')).toBe('#skills');

    const eduLink = screen.getByText('Education');
    expect(eduLink).toBeDefined();
    expect(eduLink.getAttribute('href')).toBe('#education');
  });

  test('renders navigation toggle button and handles click event', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <NavigationBar />
      </I18nextProvider>
    );

    const toggleButton = container.querySelector('.navbar-toggler');
    expect(toggleButton).not.toBeNull();

    if (toggleButton) {
      expect(toggleButton.getAttribute('aria-controls')).toBe('basic-navbar-nav');
      fireEvent.click(toggleButton);
    }
  });

  test('renders custom brand and section titles when translations change', () => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'personalInfo.name': 'John Doe',
          'sections.experience': 'Work History',
          'sections.skills': 'Expertise',
          'sections.education': 'Qualifications',
        };

        return translations[key] || key;
      },
    });

    render(<NavigationBar />);

    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Work History')).toBeDefined();
    expect(screen.getByText('Expertise')).toBeDefined();
    expect(screen.getByText('Qualifications')).toBeDefined();
  });
});
