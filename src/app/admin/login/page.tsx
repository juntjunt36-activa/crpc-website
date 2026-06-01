import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const t = await getTranslations('admin.login');

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-text-muted">{t('subtitle')}</p>
      </div>

      <div className="rounded-lg border border-bg-elevated bg-bg-card p-6 shadow-lg">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
