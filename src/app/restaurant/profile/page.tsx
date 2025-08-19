
'use client';

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
    language: 'fr' | 'en';
};

export default function ProfilePage() {
    const { language, setLanguage, t } = useLanguage();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);


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
        changePassword: { fr: "Changer le mot de passe", en: "Change Password" },
        passwordChanged: { fr: "Mot de passe modifié avec succès", en: "Password changed successfully" },
        profileUpdated: { fr: "Profil mis à jour avec succès", en: "Profile updated successfully" },
        errorOccurred: { fr: "Une erreur s'est produite", en: "An error occurred" },
        preferences: { fr: "Préférences", en: "Preferences" },
        languageLabel: { fr: "Langue", en: "Language" },
        languageDesc: { fr: "Choisissez la langue de l'interface.", en: "Choose the interface language." },
        french: { fr: "Français", en: "French" },
        english: { fr: "Anglais", en: "English" },
        save: { fr: "Enregistrer les modifications", en: "Save Changes" }
    };
    
    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
    };

    // Fetch user profile on component mount
    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/restaurant/profile');
            if (response.ok) {
                const profile = await response.json();
                setUserProfile(profile);
                setProfileImage(profile.profileImage);
                if (profile.language && profile.language !== language) {
                    setLanguage(profile.language);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error(t(translations.errorOccurred));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!userProfile) return;
        
        setSaving(true);
        try {
            const response = await fetch('/api/restaurant/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    email: userProfile.email,
                    profileImage,
                    language
                })
            });

            if (response.ok) {
                const updatedProfile = await response.json();
                setUserProfile(updatedProfile);
                toast.success(t(translations.profileUpdated));
            } else {
                const error = await response.json();
                toast.error(error.error || t(translations.errorOccurred));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(t(translations.errorOccurred));
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setChangingPassword(true);
        try {
            const response = await fetch('/api/restaurant/profile/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (response.ok) {
                toast.success(t(translations.passwordChanged));
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const error = await response.json();
                toast.error(error.error || t(translations.errorOccurred));
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(t(translations.errorOccurred));
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="text-center">
                <p>Erreur lors du chargement du profil</p>
            </div>
        );
    }

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
                            <AvatarImage src={profileImage || undefined} data-ai-hint="user profile"/>
                            <AvatarFallback>{(userProfile.firstName?.[0] || '') + (userProfile.lastName?.[0] || '')}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                             <Label>{t(translations.photo)}</Label>
                             <div className="flex gap-2">
                                <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                <Button variant="outline" onClick={handleImageUploadClick}><Camera className="mr-2 h-4 w-4" />{t(translations.upload)}</Button>
                                <Button variant="ghost" className="text-destructive" onClick={handleRemoveImage}>{t(translations.remove)}</Button>
                             </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first-name">{t(translations.firstName)}</Label>
                            <Input 
                                id="first-name" 
                                value={userProfile.firstName} 
                                onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last-name">{t(translations.lastName)}</Label>
                            <Input 
                                id="last-name" 
                                value={userProfile.lastName} 
                                onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t(translations.email)}</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            value={userProfile.email} 
                            onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                        />
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
                        <Input 
                            id="current-password" 
                            type="password" 
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t(translations.newPassword)}</Label>
                            <Input 
                                id="new-password" 
                                type="password" 
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t(translations.confirmPassword)}</Label>
                            <Input 
                                id="confirm-password" 
                                type="password" 
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button 
                            onClick={handleChangePassword}
                            disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                            {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t(translations.changePassword)}
                        </Button>
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
                <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t(translations.save)}
                </Button>
            </div>
        </div>
    );
}
