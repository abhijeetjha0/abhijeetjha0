import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { SECTION_IDS } from '../constants';

export default function Hero() {
    const { t } = useTranslation();

    return (
        <div id={SECTION_IDS.HOME} className="bg-light py-5 mb-5">
            <Container>
                <Row className="align-items-center">
                    <Col md={8}>
                        <h1 className="display-3 fw-bold">{t('personalInfo.name')}</h1>
                        <h2 className="text-secondary mb-4">{t('personalInfo.title')}</h2>
                        <p className="lead">{t('about.description')}</p>
                    </Col>
                    <Col md={4} className="text-md-end mt-4 mt-md-0">
                        <div className="contact-info">
                            <p className="mb-1"><strong>{t('contactLabels.email')}</strong> <a href={`mailto:${t('personalInfo.email')}`}>{t('personalInfo.email')}</a></p>
                            <p className="mb-1"><strong>{t('contactLabels.location')}</strong> {t('personalInfo.location')}</p>
                            <p className="mb-1"><strong>{t('contactLabels.github')}</strong> <a href={`https://${t('personalInfo.github')}`} target="_blank" rel="noopener noreferrer">{t('personalInfo.github')}</a></p>
                            <p className="mb-0"><strong>{t('contactLabels.linkedin')}</strong> <a href={`https://${t('personalInfo.linkedin')}`} target="_blank" rel="noopener noreferrer">{t('personalInfo.linkedin')}</a></p>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
