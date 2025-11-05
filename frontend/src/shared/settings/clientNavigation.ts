export type ClientSettingsNavItem = {
  id: string;
  label: string;
  path: string; // relative to /client/settings
};

export type ClientSettingsNavGroup = {
  id: string;
  title: string;
  items: ClientSettingsNavItem[];
};

export const CLIENT_SETTINGS_NAV: ClientSettingsNavGroup[] = [
  {
    id: 'configuracion',
    title: 'Configuración',
    items: [
      { id: 'users', label: 'Usuarios', path: 'users' },
      { id: 'profile', label: 'Perfil', path: 'profile' },
      { id: 'company', label: 'Datos Cliente', path: 'company' },
    ],
  },
];

export function getClientSettingsBasePath(pathname?: string | null): string {
  if (!pathname) {
    return '/client/settings';
  }

  const segments = pathname
    .split('/')
    .filter(Boolean);

  const settingsIndex = segments.indexOf('settings');
  if (settingsIndex === -1) {
    return segments.length > 0 ? `/${segments.join('/')}` : '/client/settings';
  }

  const baseSegments = segments.slice(0, settingsIndex + 1);
  return baseSegments.length > 0 ? `/${baseSegments.join('/')}` : '/client/settings';
}

export function buildClientSettingsHref(pathname: string | null | undefined, path: string): string {
  const base = getClientSettingsBasePath(pathname);
  const cleaned = path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleaned) {
    return base;
  }
  return `${base}/${cleaned}`;
}
