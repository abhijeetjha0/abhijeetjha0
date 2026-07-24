import { Container, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { EducationInfo } from '../@types';

export default function Education() {
  const { t } = useTranslation();
  const rawEducation = t('education', { returnObjects: true });
  const education = (rawEducation && typeof rawEducation === 'object')
    ? (rawEducation as EducationInfo)
    : ({} as EducationInfo);

  return (
    <section id="education" className="py-5 mb-5">
      <Container>
        <h2 className="text-center mb-5">{t('sections.education')}</h2>
        {education.degree && (
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <h3 className="h4 fw-bold">{education.degree}</h3>
              <h4 className="h5 text-primary mb-3">{education.institution}</h4>
              <p className="text-muted mb-0">{education.period}</p>
            </Card.Body>
          </Card>
        )}
      </Container>
    </section>
  );
}
