import { useState, useMemo, CSSProperties } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { SKILL_CATEGORY_METADATA, SECTION_IDS } from '../constants';
import { CategoryConfig, SkillsDictionary } from '../@types';

export default function Skills() {
    const { t } = useTranslation();
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const categories: CategoryConfig[] = useMemo(() => {
        const skills = (t('skills', { returnObjects: true }) || {}) as SkillsDictionary;

        return SKILL_CATEGORY_METADATA.map((meta) => ({
            ...meta,
            data: skills[meta.translationKey] || [],
            customStyle: {
                '--accent-color': meta.color,
                '--accent-bg': meta.bgLight,
            } as CSSProperties,
        }));
    }, [t]);

    const filteredCategories = useMemo(() => {
        return activeFilter === 'all'
            ? categories
            : categories.filter((c) => c.id === activeFilter);
    }, [activeFilter, categories]);

    const totalSkillsCount = useMemo(() => {
        return categories.reduce((sum, cat) => sum + (cat.data?.length || 0), 0);
    }, [categories]);

    return (
        <section id={SECTION_IDS.SKILLS} className="py-5 skills-section">
            <Container>
                <div className="text-center mb-5">
                    <h2 className="display-6 fw-bold text-dark mb-2">{t('sections.skills')}</h2>
                    <p className="text-muted mx-auto max-width-600">
                        {t('skillsSection.description')}
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
                            {t('skillsSection.filterAll')} ({totalSkillsCount})
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
                            <div tabIndex={0} className="skill-card card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative" style={category.customStyle}>
                                <div className="card-accent-bar" />
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center mb-3 gap-3">
                                        <div className="category-icon-box rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
                                            {category.icon}
                                        </div>
                                        <div>
                                            <h3 className="h6 fw-bold mb-0 text-dark">{category.label}</h3>
                                            <span className="text-muted small">{category.data.length} {t('skillsSection.skillsCount')}</span>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-wrap gap-2 pt-2">
                                        {category.data.map((skill: string) => (
                                            <span
                                                key={skill}
                                                tabIndex={0}
                                                className="skill-pill rounded-pill px-3 py-1 text-dark small fw-medium"
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
