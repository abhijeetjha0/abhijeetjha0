import { render, screen } from '@testing-library/react';
import Education from '../../src/components/Education';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';

jest.mock('react-i18next', () => {
  const original = jest.requireActual('react-i18next');

  return {
    ...original,
    useTranslation: jest.fn().mockImplementation(original.useTranslation),
  };
});

describe('Education Component', () => {
  const actualUseTranslation = jest.requireActual('react-i18next').useTranslation;

  beforeEach(() => {
    (useTranslation as jest.Mock).mockImplementation(actualUseTranslation);
  });

  test('renders section heading and default education details', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Education />
      </I18nextProvider>
    );

    expect(screen.getByRole('heading', { level: 2, name: /Education/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 3, name: 'B.Tech in IT' })).toBeDefined();
    expect(screen.getByText('Swami Keshwanand Institute of Technology, Jaipur')).toBeDefined();
    expect(screen.getByText('Aug 2016 - Jul 2020')).toBeDefined();
  });

  test('renders section element with correct education id', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <Education />
      </I18nextProvider>
    );

    const section = container.querySelector('section#education');
    expect(section).not.toBeNull();
  });

  test('handles custom mock education data gracefully', () => {
    const mockEducation = [{
      degree: 'Master of Computer Science',
      institution: 'Stanford University',
      period: '2021 - 2023',
    }];

    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === 'sections.education') return 'Academic Background';
        if (key === 'education' && options?.returnObjects) return mockEducation;

        return key;
      },
    });

    render(<Education />);

    expect(screen.getByText('Academic Background')).toBeDefined();
    expect(screen.getByRole('heading', { level: 3, name: 'Master of Computer Science' })).toBeDefined();
    expect(screen.getByText('Stanford University')).toBeDefined();
    expect(screen.getByText('2021 - 2023')).toBeDefined();
  });

  test('handles empty or missing education object gracefully without crashing', () => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === 'sections.education') return 'Education';
        if (key === 'education' && options?.returnObjects) return null;

        return key;
      },
    });

    render(<Education />);

    expect(screen.getByRole('heading', { level: 2, name: /Education/i })).toBeDefined();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });
});
