import { NavigationWhite } from '@/components/landing/NavigationWhite';
import { FooterSection } from '@/components/landing/FooterSection';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <NavigationWhite />
      <main>
        {children}
      </main>
      <FooterSection />
    </div>
  );
}