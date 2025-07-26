

'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, Shield } from "lucide-react";

export default function AdminSettingsPage() {

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to save credentials would go here
        // For now, we can just log it or show a toast
        console.log("Saving Stripe credentials...");
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <header className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Paramètres de la Plateforme</h2>
                    <p className="text-muted-foreground">Gérez les intégrations et les clés API globales.</p>
                </div>
            </header>

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <svg role="img" viewBox="0 0 48 48" className="h-8 w-8"><path d="M43.013 13.062c.328-.18.72-.038.898.292.18.328.038.72-.29.898l-2.91 1.593c.318.92.483 1.88.483 2.864v.002c0 2.14-.52 4.19-1.48 5.968l-4.223 2.152a.634.634 0 0 1-.87-.303l-1.05-2.05c-.06-.118-.08-.25-.062-.378.017-.128.072-.244.158-.33l3.525-3.524a.632.632 0 0 1 .894 0 .632.632 0 0 1 0 .894l-3.525-3.523c-.34.34-.798.53-1.27.53-.47 0-.928-.19-1.27-.53l-2.028-2.027a1.796 1.796 0 1 1 2.54-2.54l3.525 3.525a.632.632 0 0 0 .894 0 .632.632 0 0 0 0-.894l-3.525-3.524a1.8 1.8 0 0 0-1.27-.527c-.47 0-.928.188-1.27.527L28.12 25.1a1.796 1.796 0 0 1-2.54 0 1.796 1.796 0 0 1 0-2.54l2.028-2.027a1.795 1.795 0 0 1 1.27-.53c.47 0 .93.19 1.27.53l1.05 1.05c.06.06.136.09.213.09s.154-.03.213-.09l4.223-2.152A7.26 7.26 0 0 0 37.3 13.44l2.91-1.593a.633.633 0 0 1 .802-.286Zm-25.04 18.59c-.328.18-.72.038-.898-.29-.18-.328-.038-.72.29-.898l2.91-1.594c-.318-.92-.483-1.88-.483-2.863 0-2.14.52-4.19 1.48-5.968l4.223-2.152a.634.634 0 0 1 .87.303l1.05 2.05c.06.118.08.25.062-.378-.017.128-.072-.244-.158-.33l-3.525 3.525a.632.632 0 0 1-.894 0 .632.632 0 0 1 0-.894l3.525-3.525c.34-.34.798-.53-1.27-.53.47 0 .928.19 1.27.53l2.028 2.027a1.796 1.796 0 1 1-2.54 2.54l-3.525-3.525a.632.632 0 0 0-.894 0 .632.632 0 0 0 0 .894l3.525 3.525c.34.34.798.528 1.27.528.47 0 .928-.188 1.27-.528l2.028-2.027a1.796 1.796 0 0 1 2.54 0c.7.7.7 1.84 0 2.54l-2.028 2.027a1.795 1.795 0 0 1-1.27.53c-.47 0-.93-.19-1.27-.53l-1.05-1.05c-.06-.06-.136-.09-.213-.09s.154-.03-.213-.09l-4.223 2.152c-1.428.73-3.033 1.15-4.708 1.15l-2.91 1.593a.633.633 0 0 1-.803.285ZM13.442 4.986c0 2.705-2.22 4.9-4.95 4.9s-4.95-2.195-4.95-4.9c0-2.705 2.22-4.9 4.95-4.9s4.95 2.195 4.95 4.9Z" fill="#635bff"></path></svg>
                            <span>Configuration Stripe</span>
                        </CardTitle>
                        <CardDescription>
                            Entrez vos clés API Stripe pour activer le paiement des abonnements et les transferts vers les restaurateurs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                             <Label htmlFor="stripe-mode">Mode</Label>
                             <Select name="stripe-mode" defaultValue="test">
                                <SelectTrigger id="stripe-mode" className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="test">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-orange-500" />
                                            <span>Mode Test</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="live">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>Mode Live</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stripe-pk" className="flex items-center gap-2"><KeyRound className="h-4 w-4"/>Clé Publique</Label>
                            <Input id="stripe-pk" name="stripe-pk" placeholder="pk_test_..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stripe-sk" className="flex items-center gap-2"><KeyRound className="h-4 w-4"/>Clé Secrète</Label>
                            <Input id="stripe-sk" name="stripe-sk" type="password" placeholder="sk_test_..." />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit">Enregistrer les informations</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

