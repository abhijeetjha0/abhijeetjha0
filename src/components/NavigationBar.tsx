import { Navbar, Container, Nav } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { NAV_LINKS, SECTION_IDS } from '../constants';

export default function NavigationBar() {
    const { t } = useTranslation();

    return (
        <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="mb-4">
            <Container>
                <Navbar.Brand href={`#${SECTION_IDS.HOME}`}>{t('personalInfo.name')}</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" role="navigation">
                    <Nav className="ms-auto">
                        {NAV_LINKS.map(link => (
                            <Nav.Link key={link.id} href={link.href}>
                                {t(link.labelKey)}
                            </Nav.Link>
                        ))}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
