

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/contexts/language-context';

export function Header() {
  const { t } = useLanguage();

  const loginLabel = { fr: "Connexion", en: "Log In" };
  const signupLabel = { fr: "S'inscrire", en: "Sign Up" };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">{t(loginLabel)}</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">{t(signupLabel)}</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
