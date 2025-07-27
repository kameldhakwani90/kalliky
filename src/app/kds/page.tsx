
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, LogIn } from 'lucide-react';

export default function KDSLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [connectionCode, setConnectionCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Dummy validation
        setTimeout(() => {
            if (connectionCode.toUpperCase() === 'AB12-CD34') {
                router.push('/kds/display');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Code de connexion invalide',
                    description: 'Veuillez vérifier votre code et réessayer.',
                });
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                       <Logo />
                    </div>
                    <CardTitle className="text-2xl font-headline">Accès KDS</CardTitle>
                    <CardDescription>Entrez le code de connexion de votre cuisine.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="connection-code" className="flex items-center gap-2"><KeyRound/> Code de Connexion</Label>
                        <Input
                            id="connection-code"
                            value={connectionCode}
                            onChange={(e) => setConnectionCode(e.target.value)}
                            placeholder="ex: AB12-CD34"
                            required
                            className="text-center text-lg font-mono tracking-widest"
                            autoFocus
                        />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Connexion...' : (
                                <>
                                 <LogIn className="mr-2 h-4 w-4"/> Se connecter
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
