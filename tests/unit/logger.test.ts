describe('Logger Utility', () => {
  test('delegates logging to console.log', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await jest.isolateModulesAsync(async () => {
      const { logger } = await import('../../src/utilities/logger');
      logger('Test log message', { key: 'value' });
      expect(consoleSpy).toHaveBeenCalledWith('Test log message', { key: 'value' });
    });

    consoleSpy.mockRestore();
  });
});
