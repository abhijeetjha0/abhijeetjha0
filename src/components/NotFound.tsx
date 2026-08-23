import { Container, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export default function NotFound() {
    const { t } = useTranslation();

    return (
        <section className="py-5 my-5">
            <Container className="d-flex flex-column align-items-center justify-content-center text-center">
                <div className="mb-4">
                    <h1 className="display-1 fw-bold text-primary">404</h1>
                    <h2 className="h3 mb-3 text-dark">{t('notFound.title')}</h2>
                    <p className="text-muted mb-4 lead mx-auto max-width-600">
                        {t('notFound.description')}
                    </p>
                </div>
                <Link to="/">
                    <Button variant="primary" size="lg" className="rounded-pill px-4 shadow-sm">
                        {t('notFound.backHome')}
                    </Button>
                </Link>
            </Container>
        </section>
    );
}
