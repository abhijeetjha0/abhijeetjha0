import { ReactNode, useState, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface CategoryConfig {
  id: string;
  label: string;
  data: string[];
  color: string;
  bgLight: string;
  icon: ReactNode;
}

export default function Skills() {
  const { t } = useTranslation();
  const skills = (t('skills', { returnObjects: true }) || {}) as Record<string, string[]>;
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const categories: CategoryConfig[] = useMemo(() => [
    {
      id: 'frameworks',
      label: 'Libraries & Frameworks',
      data: skills.frameworks || [],
      color: '#6366f1',
      bgLight: '#eef2ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      id: 'languages',
      label: 'Programming Languages',
      data: skills.languages || [],
      color: '#2563eb',
      bgLight: '#eff6ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      id: 'webTech',
      label: 'Web Technologies',
      data: skills.webTech || [],
      color: '#059669',
      bgLight: '#ecfdf5',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      id: 'aiSkills',
      label: 'AI Skills & Practices',
      data: skills.aiSkills || [],
      color: '#7c3aed',
      bgLight: '#f5f3ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
        </svg>
      ),
    },
    {
      id: 'aiTools',
      label: 'AI Tools & Platforms',
      data: skills.aiTools || [],
      color: '#8b5cf6',
      bgLight: '#f3e8ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16.01" />
          <line x1="16" y1="16" x2="16" y2="16.01" />
        </svg>
      ),
    },
    {
      id: 'buildTools',
      label: 'Build Tools',
      data: skills.buildTools || [],
      color: '#d97706',
      bgLight: '#fffbeb',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    {
      id: 'linting',
      label: 'Quality & Linting',
      data: skills.linting || [],
      color: '#9333ea',
      bgLight: '#faf5ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'others',
      label: 'Tools & Workflows',
      data: skills.others || [],
      color: '#0891b2',
      bgLight: '#ecfeff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      id: 'leadership',
      label: 'Leadership & Management',
      data: skills.leadership || [],
      color: '#ea580c',
      bgLight: '#fff7ed',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ], [skills.frameworks, skills.languages, skills.webTech, skills.aiSkills, skills.aiTools, skills.buildTools, skills.linting, skills.others, skills.leadership]);

  const filteredCategories = useMemo(() => {
    return activeFilter === 'all'
      ? categories
      : categories.filter(c => c.id === activeFilter);
  }, [activeFilter, categories]);

  const totalSkillsCount = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.data?.length || 0), 0);
  }, [categories]);

  return (
    <section id="skills" className="py-5 skills-section">
      <Container>
        <div className="text-center mb-5">
          <span className="badge bg-primary-subtle text-primary fw-semibold px-3 py-2 rounded-pill mb-2">
            Technical Expertise
          </span>
          <h2 className="display-6 fw-bold text-dark mb-2">{t('sections.skills')}</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            A comprehensive overview of technical capabilities, frameworks, and modern tools I leverage to craft high-performance web applications.
          </p>

          {/* Interactive Filter Bar */}
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`btn btn-sm rounded-pill px-3 py-2 ${activeFilter === 'all'
                  ? 'btn-primary shadow-sm'
                  : 'btn-outline-secondary border-0 bg-white shadow-sm'
                }`}
            >
              All ({totalSkillsCount})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`btn btn-sm rounded-pill px-3 py-2 ${activeFilter === cat.id
                    ? 'btn-primary shadow-sm'
                    : 'btn-outline-secondary border-0 bg-white shadow-sm'
                  }`}
              >
                {cat.label} ({cat.data.length})
              </button>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <Row className="g-4">
          {filteredCategories.map((category) => (
            <Col md={6} lg={4} key={category.id}>
              <div className="skill-card card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                <div
                  className="card-accent-bar"
                  style={{ backgroundColor: category.color }}
                />
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="category-icon-box rounded-3 d-flex align-items-center justify-content-center me-3"
                      style={{
                        backgroundColor: category.bgLight,
                        color: category.color,
                        width: '42px',
                        height: '42px',
                      }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="h6 fw-bold mb-0 text-dark">{category.label}</h3>
                      <span className="text-muted small">{category.data.length} skills</span>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 pt-2">
                    {category.data.map((skill: string, sIndex: number) => (
                      <span
                        key={sIndex}
                        className="skill-pill rounded-pill px-3 py-1 text-dark small fw-medium"
                        style={{
                          '--accent-color': category.color,
                          '--accent-bg': category.bgLight,
                        } as React.CSSProperties}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
