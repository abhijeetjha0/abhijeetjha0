import { CSSProperties } from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useGitHubProjects } from '../hooks/useGitHubProjects';
import { PROJECTS_CONFIG } from '../constants';

export default function Projects() {
    const { t } = useTranslation();
    const { projects, isLoading } = useGitHubProjects();

    return (
        <section id="projects" className="py-5 mb-5">
            <Container>
                <h2 className="display-6 fw-bold text-dark text-center mb-5">{t('sections.projects')}</h2>
                <Row className="g-4">
                    {isLoading && projects.length === 0 ? (
                        Array.from({ length: 6 }).map((_, idx) => (
                            <Col key={`project-skeleton-${idx}`} xs={12} md={6} lg={4}>
                                <Card className="shadow-sm border-0 h-100 project-card placeholder-glow" aria-hidden="true">
                                    <Card.Body className="p-4 d-flex flex-column">
                                        <div className="mb-3">
                                            <span className="placeholder col-4 rounded-pill" style={{ height: '22px' }} />
                                        </div>
                                        <h3 className="h5 fw-bold mb-3">
                                            <span className="placeholder col-8" />
                                        </h3>
                                        <div className="flex-grow-1">
                                            <span className="placeholder col-12 d-block mb-1" />
                                            <span className="placeholder col-10 d-block mb-1" />
                                            <span className="placeholder col-6 d-block" />
                                        </div>
                                        <div className="placeholder col-12 rounded mt-3" style={{ height: '38px' }} />
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))
                    ) : (
                        projects.map(project => (
                            <Col key={project.link || project.name} xs={12} md={6} lg={4}>
                                <Card className="shadow-sm border-0 h-100 project-card">
                                    <Card.Body className="p-4 d-flex flex-column">
                                        {project.language && (
                                            <div className="mb-2">
                                                <span
                                                    className="project-lang-badge"
                                                    style={{
                                                        '--lang-color':
                                                        PROJECTS_CONFIG.LANGUAGE_COLORS[project.language] || '#64748b',
                                                    } as CSSProperties}
                                                >
                                                    <span className="project-lang-dot" aria-hidden="true" />
                                                    {project.language}
                                                </span>
                                            </div>
                                        )}
                                        <h3 className="h5 fw-bold mb-3">{project.name}</h3>
                                        <p className="text-muted flex-grow-1">{project.description}</p>
                                        {project.homepage ? (
                                            <div className="d-flex gap-2 mt-3">
                                                <a
                                                    href={project.homepage}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary flex-fill"
                                                >
                                                    {t('projectsSection.liveDemo', 'Live Demo')}
                                                </a>
                                                <a
                                                    href={project.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-outline-primary flex-fill"
                                                >
                                                    {t('projectsSection.viewProject', 'View Project')}
                                                </a>
                                            </div>
                                        ) : (
                                            <a
                                                href={project.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-outline-primary mt-3 w-100"
                                            >
                                                {t('projectsSection.viewProject', 'View Project')}
                                            </a>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        )))}
                </Row>
            </Container>
        </section>
    );
}
