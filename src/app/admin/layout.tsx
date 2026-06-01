import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-bg-elevated bg-bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-mono text-sm font-semibold text-text-primary"
          >
            <Lock className="h-4 w-4 text-accent-cyan" aria-hidden />
            <span>
              <span className="text-accent-cyan">CRPC</span>
              <span className="ml-1 text-text-muted">admin</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-text-muted transition-colors hover:text-text-primary"
          >
            ← public site
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
