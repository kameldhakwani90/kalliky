
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
    const { language, setLanguage, t } = useLanguage();

    const translations = {
        title: { fr: "Profil Utilisateur", en: "User Profile" },
        description: { fr: "Gérez les informations de votre compte et vos préférences.", en: "Manage your account information and preferences." },
        accountInfo: { fr: "Informations du compte", en: "Account Information" },
        firstName: { fr: "Prénom", en: "First Name" },
        lastName: { fr: "Nom", en: "Last Name" },
        email: { fr: "Email", en: "Email Address" },
        photo: { fr: "Photo de profil", en: "Profile Photo" },
        upload: { fr: "Télécharger une nouvelle photo", en: "Upload a new photo" },
        remove: { fr: "Supprimer", en: "Remove" },
        password: { fr: "Mot de passe", en: "Password" },
        passwordDesc: { fr: "Gérez votre mot de passe.", en: "Manage your password." },
        currentPassword: { fr: "Mot de passe actuel", en: "Current Password" },
        newPassword: { fr: "Nouveau mot de passe", en: "New Password" },
        confirmPassword: { fr: "Confirmer le mot de passe", en: "Confirm New Password" },
        preferences: { fr: "Préférences", en: "Preferences" },
        languageLabel: { fr: "Langue", en: "Language" },
        languageDesc: { fr: "Choisissez la langue de l'interface.", en: "Choose the interface language." },
        french: { fr: "Français", en: "French" },
        english: { fr: "Anglais", en: "English" },
        save: { fr: "Enregistrer les modifications", en: "Save Changes" }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                <p className="text-muted-foreground">{t(translations.description)}</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>{t(translations.accountInfo)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src="https://placehold.co/100x100" />
                            <AvatarFallback>LP</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                             <Label>{t(translations.photo)}</Label>
                             <div className="flex gap-2">
                                <Button variant="outline"><Camera className="mr-2 h-4 w-4" />{t(translations.upload)}</Button>
                                <Button variant="ghost" className="text-destructive">{t(translations.remove)}</Button>
                             </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first-name">{t(translations.firstName)}</Label>
                            <Input id="first-name" defaultValue="Louis" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last-name">{t(translations.lastName)}</Label>
                            <Input id="last-name" defaultValue="Passard" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t(translations.email)}</Label>
                        <Input id="email" type="email" defaultValue="louis.passard@gourmet.fr" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t(translations.password)}</CardTitle>
                    <CardDescription>{t(translations.passwordDesc)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">{t(translations.currentPassword)}</Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t(translations.newPassword)}</Label>
                            <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t(translations.confirmPassword)}</Label>
                            <Input id="confirm-password" type="password" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t(translations.preferences)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t(translations.languageLabel)}</Label>
                        <p className="text-sm text-muted-foreground">{t(translations.languageDesc)}</p>
                        <Select value={language} onValueChange={(value) => setLanguage(value as 'fr' | 'en')}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fr">{t(translations.french)}</SelectItem>
                                <SelectItem value="en">{t(translations.english)}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

             <div className="flex justify-end">
                <Button>{t(translations.save)}</Button>
            </div>
        </div>
    );
}
