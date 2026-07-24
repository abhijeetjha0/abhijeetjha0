import { Container, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ExperienceItem } from '../@types';

export default function Experience() {
  const { t } = useTranslation();
  const rawExperiences = t('experience', { returnObjects: true });
  const experiences: ExperienceItem[] = Array.isArray(rawExperiences) ? rawExperiences : [];

  return (
    <section id="experience" className="py-5">
      <Container>
        <h2 className="text-center mb-5">{t('sections.experience')}</h2>
        {experiences.map((exp) => {
          const itemKey = exp.id || `${exp.company}-${exp.role}-${exp.period}`;
          return (
            <Card key={itemKey} className="mb-4 shadow-sm border-0">
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <Card.Title className="h4 fw-bold">{exp.role}</Card.Title>
                    <Card.Subtitle className="mb-3 text-primary h5">{exp.company}</Card.Subtitle>
                  </Col>
                  <Col md={4} className="text-md-end text-muted">
                    <p className="mb-0">{exp.period}</p>
                    <p>{exp.location}</p>
                  </Col>
                </Row>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="mt-3">
                    {exp.highlights.map((highlight: string) => (
                      <li key={`${itemKey}-${highlight}`} className="mb-2">{highlight}</li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>
          );
        })}
      </Container>
    </section>
  );
}
