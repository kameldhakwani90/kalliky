import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-card p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-headline">Bienvenue</CardTitle>
            <CardDescription>Connectez-vous à votre espace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nom@exemple.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button asChild className="w-full">
                <Link href="/restaurant/dashboard">Restaurateur</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/dashboard">Administrateur</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Pour accéder au système de cuisine (KDS), utilisez le lien dédié.
            </p>
          </CardFooter>
        </Card>
        <div className="mt-4 text-center text-sm">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="underline text-primary">
            Inscrivez-vous
          </Link>
        </div>
      </div>
    </div>
  );
}
