import { Offcanvas } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { SettingsSidebarProps, ThemeMode } from '../@types';

const THEME_OPTIONS: { id: ThemeMode; labelKey: string }[] = [
    { id: 'light', labelKey: 'settings.light' },
    { id: 'dark', labelKey: 'settings.dark' },
    { id: 'system', labelKey: 'settings.system' },
];

export default function SettingsSidebar({
    isOpen,
    onClose,
    theme,
    resolvedTheme,
    setTheme,
}: SettingsSidebarProps) {
    const { t } = useTranslation();

    const renderThemeIcon = (mode: ThemeMode) => {
        if (mode === 'light') {
            return (
                <span
                    className="material-symbols-outlined me-2 flex-shrink-0"
                    style={{ fontSize: '18px' }}
                    aria-hidden="true"
                >
                    light_mode
                </span>
            );
        }

        if (mode === 'dark') {
            return (
                <span
                    className="material-symbols-outlined me-2 flex-shrink-0"
                    style={{ fontSize: '18px' }}
                    aria-hidden="true"
                >
                    dark_mode
                </span>
            );
        }

        return (
            <span
                className="material-symbols-outlined me-2 flex-shrink-0"
                style={{ fontSize: '18px' }}
                aria-hidden="true"
            >
                desktop_windows
            </span>
        );
    };

    return (
        <Offcanvas
            placement="end"
            show={isOpen}
            onHide={onClose}
            className="settings-offcanvas"
            aria-labelledby="settings-sidebar-title"
        >
            <Offcanvas.Header
                closeButton
                closeVariant={resolvedTheme === 'dark' ? 'white' : undefined}
                className="border-bottom"
            >
                <Offcanvas.Title as="h5" id="settings-sidebar-title" className="fs-5 fw-bold mb-0">
                    {t('settings.title')}
                </Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body className="py-4">
                <div className="mb-3">
                    <label className="form-label fw-semibold mb-2" id="theme-settings-label">
                        {t('settings.theme')}
                    </label>
                    <div
                        className="btn-group w-100 theme-toggle-group"
                        role="group"
                        aria-labelledby="theme-settings-label"
                    >
                        {THEME_OPTIONS.map(opt => {
                            const isSelected = theme === opt.id;

                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`btn btn-sm d-flex align-items-center justify-content-center py-2 ${
                                        isSelected
                                            ? 'btn-primary active fw-semibold shadow-sm'
                                            : 'btn-outline-secondary'
                                    }`}
                                    onClick={() => setTheme(opt.id)}
                                    aria-pressed={isSelected}
                                >
                                    {renderThemeIcon(opt.id)}
                                    <span>{t(opt.labelKey)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
}
