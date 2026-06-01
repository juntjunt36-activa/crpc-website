import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { GeoNotice } from './GeoNotice';

export function Footer() {
  const t = useTranslations();
  const year = new Date().getUTCFullYear();

  return (
    <footer className="mt-16 border-t border-bg-elevated bg-bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <GeoNotice variant="inline" className="mb-4" />

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">
            © {year} CRPC. {t('footer.rights')}
          </p>

          <nav className="flex gap-4 text-xs text-text-muted" aria-label="Footer">
            <Link href="/about" className="hover:text-text-primary">
              {t('nav.about')}
            </Link>
            <Link href="/trade" className="hover:text-text-primary">
              {t('nav.trade')}
            </Link>
            <Link href="/roadmap" className="hover:text-text-primary">
              {t('nav.roadmap')}
            </Link>
            <Link href="/terms" className="hover:text-text-primary">
              {t('nav.terms')}
            </Link>
          </nav>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-text-muted">
          {t('footer.disclaimer')}
        </p>
      </div>
    </footer>
  );
}
