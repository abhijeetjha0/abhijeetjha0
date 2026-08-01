import routes from '../../src/routes';
import Layout from '../../src/Layout';
import ErrorBoundary from '../../src/components/ErrorBoundary';
import Home from '../../src/components/Home';
import NotFound from '../../src/components/NotFound';
import Loader from '../../src/components/Loader';

describe('Application Routes Configuration', () => {
  test('defines the root layout route and child routes correctly', () => {
    expect(routes).toHaveLength(1);

    const rootRoute = routes[0];
    expect(rootRoute.path).toBe('/');
    expect(rootRoute.Component).toBe(Layout);
    expect(rootRoute.ErrorBoundary).toBe(ErrorBoundary);
    expect(rootRoute.HydrateFallback).toBe(Loader);
    expect(rootRoute.children).toHaveLength(2);
    expect(rootRoute.children?.[0]).toEqual({
      index: true,
      Component: Home,
    });
    expect(rootRoute.children?.[1]).toEqual({
      path: "*",
      Component: NotFound,
    });
  });

  test('executes loader function successfully', async () => {
    const rootRoute = routes[0];
    expect(typeof rootRoute.loader).toBe('function');

    if (typeof rootRoute.loader === 'function') {
      const loaderResult = await rootRoute.loader();
      expect(loaderResult).toEqual({});
    }
  });
});
