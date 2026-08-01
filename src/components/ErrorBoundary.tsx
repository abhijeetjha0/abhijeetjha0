import { useTranslation } from 'react-i18next';

export default function ErrorBoundary() {
    const { t } = useTranslation();

    return <h1>{t('errorBoundary')}</h1>;
}