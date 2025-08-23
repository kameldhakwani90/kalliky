import { NavigationWhite } from '@/components/landing/NavigationWhite';
import { FooterSection } from '@/components/landing/FooterSection';

export default function BlogLayout({
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