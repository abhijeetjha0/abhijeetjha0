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
                    <Col xs={12} sm={4} md={3} className="text-center text-sm-start">
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
                    <Col xs={12} sm={8} md={5} lg={6}>
                        <h1 className="display-4 fw-bold">{t('personalInfo.name')}</h1>
                        <h2 className="text-secondary h4 mb-3">{t('personalInfo.title')}</h2>
                        <p className="lead mb-0">{t('about.description')}</p>
                    </Col>
                    <Col xs={12} md={4} lg={3} className="mt-4 mt-md-0">
                        <div className="contact-info d-flex flex-column gap-2">
                            {/* Email */}
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-md-end gap-2">
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
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-md-end gap-2">
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
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-md-end gap-2">
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
                            <div className="contact-item d-flex align-items-center justify-content-start justify-content-md-end gap-2">
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

                            {/* Book Appointment Button */}
                            <div className="mt-2 d-flex justify-content-start justify-content-md-end">
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
