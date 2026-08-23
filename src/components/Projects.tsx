import { Container, Card, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ProjectInfo } from '../@types';

export default function Projects() {
    const { t } = useTranslation();
    const rawProjects = t('projects', { returnObjects: true });
    const projects = Array.isArray(rawProjects)
        ? (rawProjects as ProjectInfo[])
        : ([] as ProjectInfo[]);

    return (
        <section id="projects" className="py-5 mb-5">
            <Container>
                <h2 className="display-6 fw-bold text-dark text-center mb-5">{t('sections.projects')}</h2>
                <Row className="g-4">
                    {projects.map((project, index) => (
                        <Col key={index} xs={12} md={6} lg={4}>
                            <Card className="shadow-sm border-0 h-100">
                                <Card.Body className="p-4 d-flex flex-column">
                                    <h3 className="h5 fw-bold mb-3">{project.name}</h3>
                                    <p className="text-muted flex-grow-1">{project.description}</p>
                                    <a
                                        href={project.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-primary mt-3 w-100"
                                    >
                                        View Project
                                    </a>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </section>
    );
}
