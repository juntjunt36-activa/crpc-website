'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', labelKey: 'dashboard' },
  { href: '/about', labelKey: 'about' },
  { href: '/trade', labelKey: 'trade' },
  { href: '/roadmap', labelKey: 'roadmap' },
] as const;

export function Header() {
  const t = useTranslations('nav');
  const tSite = useTranslations('site');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-bg-elevated bg-bg-base/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${tSite('name')} home`}
          className="flex items-center gap-2.5"
        >
          <Image
            src="/logo-crpc-horizontal.svg"
            alt="CryptPoint"
            width={158}
            height={34}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          'md:hidden',
          open ? 'block border-t border-bg-elevated' : 'hidden',
        )}
      >
        <nav className="flex flex-col px-4 py-2" aria-label="Mobile">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-3 text-sm text-text-secondary"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
