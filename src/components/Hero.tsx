import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { SECTION_IDS, PERSONAL_INFO } from '../constants';
import profilePhoto from '../assets/profile.jpeg';

export default function Hero() {
    const { t } = useTranslation();

    return (
        <div id={SECTION_IDS.HOME} className="hero-section bg-light py-5">
            <Container>
                <Row className="align-items-center g-4">
                    <Col xs={12} sm="auto" className="text-center text-sm-start d-flex justify-content-center justify-content-sm-start">
                        <div className="profile-photo-wrapper">
                            <img
                                src={profilePhoto}
                                alt={t('personalInfo.name')}
                                className="profile-photo"
                                width={170}
                                height={170}
                                loading="eager"
                            />
                        </div>
                    </Col>
                    <Col xs={12} sm lg>
                        <h1 className="display-4 fw-bold">{t('personalInfo.name')}</h1>
                        <h2 className="text-secondary h4 mb-3">{t('personalInfo.title')}</h2>
                        <p className="lead mb-0">{t('about.description')}</p>
                    </Col>
                    <Col xs={12} lg={3} className="mt-4 mt-lg-0 ms-lg-auto">
                        <div className="contact-info d-flex flex-column gap-2">
                            {/* Email */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon email-icon"
                                    aria-label={t('contactLabels.email')}
                                    title={t('contactLabels.email')}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ color: '#0078d4' }}
                                        aria-hidden="true"
                                    >
                                        mail
                                    </span>
                                </span>
                                <a href={`mailto:${t('personalInfo.email')}`}>
                                    {t('personalInfo.email')}
                                </a>
                            </div>

                            {/* Location */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon location-icon"
                                    aria-label={t('contactLabels.location')}
                                    title={t('contactLabels.location')}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ color: '#ea4335' }}
                                        aria-hidden="true"
                                    >
                                        location_on
                                    </span>
                                </span>
                                <span>{t('personalInfo.location')}</span>
                            </div>

                            {/* GitHub */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon github-icon"
                                    aria-label={t('contactLabels.github')}
                                    title={t('contactLabels.github')}
                                >
                                    <span
                                        className="material-symbols-outlined github-contact-icon"
                                        aria-hidden="true"
                                    >
                                        code
                                    </span>
                                </span>
                                <a
                                    href={`https://${t('personalInfo.github')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('personalInfo.github')}
                                </a>
                            </div>

                            {/* LinkedIn */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon linkedin-icon"
                                    aria-label={t('contactLabels.linkedin')}
                                    title={t('contactLabels.linkedin')}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ color: '#0a66c2' }}
                                        aria-hidden="true"
                                    >
                                        work
                                    </span>
                                </span>
                                <a
                                    href={`https://${t('personalInfo.linkedin')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('personalInfo.linkedin')}
                                </a>
                            </div>

                            {/* npm */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon npm-icon"
                                    aria-label={t('contactLabels.npm')}
                                    title={t('contactLabels.npm')}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ color: '#cb3837' }}
                                        aria-hidden="true"
                                    >
                                        package_2
                                    </span>
                                </span>
                                <a
                                    href={PERSONAL_INFO.NPM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('personalInfo.npm')}
                                </a>
                            </div>

                            {/* Google Developer */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon google-dev-icon"
                                    aria-label={t('contactLabels.googleDev')}
                                    title={t('contactLabels.googleDev')}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ color: '#4285F4' }}
                                        aria-hidden="true"
                                    >
                                        developer_mode
                                    </span>
                                </span>
                                <a
                                    href={PERSONAL_INFO.GOOGLE_DEV_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('personalInfo.googleDev')}
                                </a>
                            </div>

                            {/* Ollama */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon ollama-icon"
                                    aria-label={t('contactLabels.ollama')}
                                    title={t('contactLabels.ollama')}
                                >
                                    <span
                                        className="material-symbols-outlined ollama-contact-icon"
                                        aria-hidden="true"
                                    >
                                        smart_toy
                                    </span>
                                </span>
                                <a
                                    href={PERSONAL_INFO.OLLAMA_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('personalInfo.ollama')}
                                </a>
                            </div>

                            {/* Hugging Face */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon huggingface-icon"
                                    aria-label={t('contactLabels.huggingface')}
                                    title={t('contactLabels.huggingface')}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ color: '#ff9d00' }}
                                        aria-hidden="true"
                                    >
                                        sentiment_satisfied
                                    </span>
                                </span>
                                <a
                                    href={PERSONAL_INFO.HUGGINGFACE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('personalInfo.huggingface')}
                                </a>
                            </div>

                            {/* Lovable */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-lg-end gap-2">
                                <span
                                    className="contact-icon lovable-icon"
                                    aria-label={t('contactLabels.lovable')}
                                    title={t('contactLabels.lovable')}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ color: '#ff3366' }}
                                        aria-hidden="true"
                                    >
                                        favorite
                                    </span>
                                </span>
                                <a
                                    href={PERSONAL_INFO.LOVABLE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('personalInfo.lovable')}
                                </a>
                            </div>

                            {/* Book Appointment Button */}
                            <div className="mt-2 d-flex justify-content-start justify-content-lg-end">
                                <a
                                    href={PERSONAL_INFO.APPOINTMENT_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-success d-inline-flex align-items-center gap-2 appointment-booking-btn shadow-sm"
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ fontSize: '18px' }}
                                        aria-hidden="true"
                                    >
                                        calendar_month
                                    </span>
                                    <span>{t('contactLabels.bookAppointment', 'Book Appointment')}</span>
                                </a>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
