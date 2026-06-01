import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GeoNotice } from '@/components/layout/GeoNotice';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <GeoNotice variant="banner" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
