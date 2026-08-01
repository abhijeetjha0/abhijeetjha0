import Hero from './Hero';
import Experience from './Experience';
import Skills from './Skills';
import Education from './Education';
import Projects from './Projects';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="portfolio-content">
      <Hero />
      <Experience />
      <Skills />
      <Projects />
      <Education />
      <footer className="bg-dark text-white py-4 mt-5">
        <Container className="text-center">
          <p className="mb-0">{t('footer.developedBy')} {t('personalInfo.name')}</p>
        </Container>
      </footer>
    </div>
  );
}
