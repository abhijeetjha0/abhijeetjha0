import i18n from '../../src/i18n';

describe('i18n Configuration', () => {
  test('initializes with correct default and fallback language', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.language).toBe('en');
    expect(i18n.options.fallbackLng).toContain('en');
  });

  test('correctly translates keys from en-US resource bundle', () => {
    expect(i18n.t('personalInfo.name')).toBe('Abhijit Kumar Jha');
    expect(i18n.t('sections.experience')).toBe('Professional Experience');
    expect(i18n.t('sections.skills')).toBe('Skills');
    expect(i18n.t('sections.education')).toBe('Education');
  });
});
