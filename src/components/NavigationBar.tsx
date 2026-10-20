import { useState } from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { NAV_LINKS, SECTION_IDS } from '../constants';
import { useTheme } from '../hooks';
import SettingsSidebar from './SettingsSidebar';

export default function NavigationBar() {
    const { t } = useTranslation();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { theme, resolvedTheme, setTheme } = useTheme();

    const handleOpenSettings = () => {
        setIsSettingsOpen(true);
    };

    const handleCloseSettings = () => {
        setIsSettingsOpen(false);
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="mb-4">
            <Container>
                <Navbar.Brand href={`#${SECTION_IDS.HOME}`}>{t('personalInfo.name')}</Navbar.Brand>
                <div className="d-flex align-items-center order-lg-last ms-auto">
                    <button
                        type="button"
                        id="settings-nav-btn"
                        className="btn btn-outline-light btn-sm settings-toggle-btn d-inline-flex align-items-center justify-content-center p-2 rounded-circle"
                        onClick={handleOpenSettings}
                        aria-label={t('settings.openSettings')}
                        title={t('settings.openSettings')}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '20px' }}
                            aria-hidden="true"
                        >
                            settings
                        </span>
                    </button>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" className="ms-2" />
                </div>
                <Navbar.Collapse id="basic-navbar-nav" role="navigation">
                    <Nav className="ms-auto me-lg-3">
                        {NAV_LINKS.map(link => (
                            <Nav.Link key={link.id} href={link.href}>
                                {t(link.labelKey)}
                            </Nav.Link>
                        ))}
                    </Nav>
                </Navbar.Collapse>
            </Container>
            <SettingsSidebar
                isOpen={isSettingsOpen}
                onClose={handleCloseSettings}
                theme={theme}
                resolvedTheme={resolvedTheme}
                setTheme={setTheme}
            />
        </Navbar>
    );
}

