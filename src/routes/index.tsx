import ErrorBoundary from "../components/ErrorBoundary";
import Home from "../components/Home";
import NotFound from "../components/NotFound";
import Loader from "../components/Loader";
import Layout from "../Layout";

const routes = [{
    Component: Layout,
    ErrorBoundary,
    loader: async () => {
        // TODO: Add some API call here
        return {};
    },
    path: '/',
    children: [
        {
            index: true,
            Component: Home
        },
        {
            path: "*",
            Component: NotFound
        }
    ],
    HydrateFallback: Loader
}];

export default routes;