
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Link as LinkIcon, CheckCircle } from 'lucide-react';

export default function AutomationPage() {
    const [stripeStatus, setStripeStatus] = useState<'disconnected' | 'connected'>('disconnected');

    const handleConnectStripe = () => {
        // Dans une vraie application, on redirigerait vers le flux OAuth de Stripe.
        // Pour la démo, nous simulons simplement une connexion réussie.
        setStripeStatus('connected');
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center gap-2">
                <Zap className="h-6 w-6" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Automatisation & Intégrations
                    </h1>
                    <p className="text-muted-foreground">Connectez vos services tiers pour automatiser vos processus.</p>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Paiements</CardTitle>
                    <CardDescription>Gérez vos connexions aux plateformes de paiement.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Card className="max-w-2xl">
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-3">
                                    <svg role="img" viewBox="0 0 48 48" className="h-8 w-8"><path d="M43.013 13.062c.328-.18.72-.038.898.292.18.328.038.72-.29.898l-2.91 1.593c.318.92.483 1.88.483 2.864v.002c0 2.14-.52 4.19-1.48 5.968l-4.223 2.152a.634.634 0 0 1-.87-.303l-1.05-2.05c-.06-.118-.08-.25-.062-.378.017-.128.072-.244.158-.33l3.525-3.524a.632.632 0 0 1 .894 0 .632.632 0 0 1 0 .894l-3.525 3.523c-.34.34-.798.53-1.27.53-.47 0-.928-.19-1.27-.53l-2.028-2.027a1.796 1.796 0 1 1 2.54-2.54l3.525 3.525a.632.632 0 0 0 .894 0 .632.632 0 0 0 0-.894l-3.525-3.524a1.8 1.8 0 0 0-1.27-.527c-.47 0-.928.188-1.27.527L28.12 25.1a1.796 1.796 0 0 1-2.54 0 1.796 1.796 0 0 1 0-2.54l2.028-2.027a1.795 1.795 0 0 1 1.27-.53c.47 0 .93.19 1.27.53l1.05 1.05c.06.06.136.09.213.09s.154-.03.213-.09l4.223-2.152A7.26 7.26 0 0 0 37.3 13.44l2.91-1.593a.633.633 0 0 1 .802-.286Zm-25.04 18.59c-.328.18-.72.038-.898-.29-.18-.328-.038-.72.29-.898l2.91-1.594c-.318-.92-.483-1.88-.483-2.863 0-2.14.52-4.19 1.48-5.968l4.223-2.152a.634.634 0 0 1 .87.303l1.05 2.05c.06.118.08.25.062-.378-.017.128-.072-.244-.158-.33l-3.525 3.525a.632.632 0 0 1-.894 0 .632.632 0 0 1 0-.894l3.525-3.525c.34-.34.798-.53 1.27-.53.47 0 .928.19 1.27.53l2.028 2.027a1.796 1.796 0 1 1-2.54 2.54l-3.525-3.525a.632.632 0 0 0-.894 0 .632.632 0 0 0 0 .894l3.525 3.525c.34.34.798.528 1.27.528.47 0 .928-.188 1.27-.528l2.028-2.027a1.796 1.796 0 0 1 2.54 0c.7.7.7 1.84 0 2.54l-2.028 2.027a1.795 1.795 0 0 1-1.27.53c-.47 0-.93-.19-1.27-.53l-1.05-1.05c-.06-.06-.136-.09-.213-.09s.154-.03-.213-.09l-4.223 2.152c-1.428.73-3.033 1.15-4.708 1.15l-2.91 1.593a.633.633 0 0 1-.803.285ZM13.442 4.986c0 2.705-2.22 4.9-4.95 4.9s-4.95-2.195-4.95-4.9c0-2.705 2.22-4.9 4.95-4.9s4.95 2.195 4.95 4.9Z" fill="#635bff"></path></svg>
                                    <span>Stripe</span>
                                </CardTitle>
                                <CardDescription>
                                    Connectez votre compte Stripe pour accepter les paiements par carte bancaire et gérer les abonnements.
                                </CardDescription>
                            </div>
                            {stripeStatus === 'connected' ? (
                                <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100/90">
                                    <CheckCircle className="mr-1 h-3 w-3" /> Connecté
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Non connecté</Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            {stripeStatus === 'connected' ? (
                                <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                                    Votre compte Stripe est correctement connecté. Les paiements seront traités via ce compte.
                                </div>
                            ) : (
                                <Button onClick={handleConnectStripe}>
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Connecter avec Stripe
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

        </div>
    );
}
