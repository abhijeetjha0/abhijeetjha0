import { render, screen } from '@testing-library/react';
import Experience from '../../src/components/Experience';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';

// Mock module for custom translation scenarios
jest.mock('react-i18next', () => {
  const original = jest.requireActual('react-i18next');

  return {
    ...original,
    useTranslation: jest.fn().mockImplementation(original.useTranslation),
  };
});

describe('Experience Component', () => {
  const actualUseTranslation = jest.requireActual('react-i18next').useTranslation;

  beforeEach(() => {
    (useTranslation as jest.Mock).mockImplementation(actualUseTranslation);
  });

  test('renders section heading and default experience items', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Experience />
      </I18nextProvider>
    );

    // Section title
    expect(screen.getByRole('heading', { level: 2, name: /Professional Experience/i })).toBeDefined();

    // Roles and Companies
    expect(screen.getByText('Senior Software Engineer')).toBeDefined();
    expect(screen.getByText('Software Engineer')).toBeDefined();
    expect(screen.getAllByText('Metacube Software Pvt. Ltd.').length).toBeGreaterThan(0);

    // Period and location
    expect(screen.getByText('Apr 2023 - Present')).toBeDefined();
    expect(screen.getByText('Jan 2020 - Mar 2023')).toBeDefined();
    expect(screen.getAllByText('Jaipur, India').length).toBeGreaterThan(0);

    // Highlights
    expect(screen.getByText(/Mentored and led a team of 7-10 developers/i)).toBeDefined();
    expect(screen.getByText(/Utilized React and Ember.js to deliver robust/i)).toBeDefined();
  });

  test('renders section element with correct experience id', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <Experience />
      </I18nextProvider>
    );

    const section = container.querySelector('section#experience');
    expect(section).not.toBeNull();
  });

  test('handles custom mock experience data gracefully', () => {
    const mockExperiences = [
      {
        company: 'Acme Corp',
        role: 'Lead Architect',
        period: '2024 - Present',
        location: 'Remote',
        highlights: ['Built scalable micro-frontends', 'Optimized web vitals'],
      },
    ];

    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === 'sections.experience') return 'Work Experience';
        if (key === 'experience' && options?.returnObjects) return mockExperiences;

        return key;
      },
    });

    render(<Experience />);

    expect(screen.getByText('Work Experience')).toBeDefined();
    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Lead Architect')).toBeDefined();
    expect(screen.getByText('2024 - Present')).toBeDefined();
    expect(screen.getByText('Remote')).toBeDefined();
    expect(screen.getByText('Built scalable micro-frontends')).toBeDefined();
    expect(screen.getByText('Optimized web vitals')).toBeDefined();
  });

  test('handles empty or invalid experience array gracefully without crashing', () => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === 'sections.experience') return 'Professional Experience';
        if (key === 'experience' && options?.returnObjects) return null;

        return key;
      },
    });

    render(<Experience />);

    expect(screen.getByText('Professional Experience')).toBeDefined();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
  });
});
