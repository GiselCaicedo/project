'use client';

import { Bell } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  locale: string;
  variant?: 'admin' | 'client';
  userName?: string;
  avatarUrl?: string | null;
};

type JwtPayload = {
  name?: string;
  user?: string;
  usuario?: string;
  picture?: string;
  avatar?: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] ?? '').toUpperCase() + (parts[1]![0] ?? '').toUpperCase();
}

export default function HeaderUserBar({ locale, variant = 'admin', userName: initialName = '', avatarUrl: initialAvatar = null }: Props) {
  const [userName, setUserName] = useState<string>(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);

  useEffect(() => {
    if (userName) return;
    try {
      const token = typeof window !== 'undefined'
        ? window.sessionStorage.getItem('auth_token') || window.localStorage.getItem('auth_token')
        : null;
      if (!token) return;
      const base64 = token.split('.')[1];
      if (!base64) return;
      const json = atob(base64);
      const payload = JSON.parse(json) as JwtPayload;
      const name = payload.name || payload.user || payload.usuario || '';
      setUserName(name);
      setAvatarUrl(payload.picture || payload.avatar || null);
    } catch {
      // ignore
    }
  }, [userName]);

  const initials = useMemo(() => (userName ? getInitials(userName) : ''), [userName]);
  const dateText = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date()), [locale]);

  const avatarSize = variant === 'admin' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  return (
    <div className="mb-4 flex items-center justify-end gap-4 pb-4 relative">
      <span className="absolute bottom-0 right-0 w-[500px] border-b-2 border-gray-100"></span>

      <div className="hidden text-sm text-gray-600 sm:block">{dateText}</div>
      <button
        type="button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500"></span>
      </button>
      <div className="flex items-center gap-3">
        <div className={`relative overflow-hidden rounded-full bg-primary-100 text-primary-700 ring-1 ring-primary-200 ${avatarSize}`}>
          {avatarUrl
            ? (<img src={avatarUrl} alt={userName || 'Usuario'} className="h-full w-full object-cover" />)
            : (<span className="flex h-full w-full items-center justify-center font-semibold">{initials || 'US'}</span>)}
        </div>
        <div className="hidden min-w-0 flex-col sm:flex">
          <span className="truncate text-sm font-semibold text-gray-900">{userName || 'Usuario'}</span>
        </div>
      </div>
    </div>
  );
}

