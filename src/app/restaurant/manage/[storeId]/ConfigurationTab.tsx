'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Store, 
  Clock, 
  Receipt, 
  MessageSquare,
  Settings,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ConfigurationTabProps {
  storeId: string;
  storeName: string;
  storeData?: any;
  onConfigUpdate?: (updates: any) => void;
}

export default function ConfigurationTab({ storeId, storeName, storeData, onConfigUpdate }: ConfigurationTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStoreData();
  }, [storeId]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'API réelle
      const mockData = {
        id: storeId,
        name: storeName || 'MARIO Pizza',
        description: 'Pizzeria traditionnelle avec des ingrédients frais',
        address: '145 rue de Chevilly',
        phone: '+33 1 23 45 67 89',
        email: 'contact@mario-pizza.fr',
        website: 'https://mario-pizza.fr',
        currency: 'EUR',
        timezone: 'Europe/Paris',
        businessHours: {
          monday: { isOpen: true, open: '11:00', close: '22:00' },
          tuesday: { isOpen: true, open: '11:00', close: '22:00' },
          wednesday: { isOpen: true, open: '11:00', close: '22:00' },
          thursday: { isOpen: true, open: '11:00', close: '22:00' },
          friday: { isOpen: true, open: '11:00', close: '22:00' },
          saturday: { isOpen: true, open: '11:00', close: '23:00' },
          sunday: { isOpen: false, open: '', close: '' }
        },
        taxSettings: {
          defaultTaxRate: 20,
          taxIncluded: true,
          taxName: 'TVA'
        },
        socialMedia: {
          facebook: 'https://facebook.com/mario-pizza',
          instagram: '@mario_pizza_paris',
          twitter: '@mario_pizza'
        },
        ...storeData
      };
      setData(mockData);
    } catch (error) {
      console.error('Erreur chargement données boutique:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const saveStoreData = async () => {
    try {
      setSaving(true);
      // TODO: Implémenter l'API de sauvegarde
      if (onConfigUpdate) {
        await onConfigUpdate(data);
      }
      toast.success('Configuration sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Informations générales
          </CardTitle>
          <CardDescription>
            Gérez les informations de base de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nom de la boutique</Label>
              <Input
                id="storeName"
                value={data?.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Ex: MARIO Pizza"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeEmail">Email</Label>
              <Input
                id="storeEmail"
                type="email"
                value={data?.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contact@mario-pizza.fr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription">Description</Label>
            <Textarea
              id="storeDescription"
              value={data?.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Décrivez votre boutique..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storePhone">Téléphone</Label>
              <Input
                id="storePhone"
                value={data?.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeWebsite">Site web</Label>
              <Input
                id="storeWebsite"
                value={data?.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://mario-pizza.fr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeAddress">Adresse</Label>
            <Textarea
              id="storeAddress"
              value={data?.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 Rue de la Pizza, 75001 Paris"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Horaires d'ouverture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires d'ouverture
          </CardTitle>
          <CardDescription>
            Configurez les horaires d'ouverture de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => {
            const dayData = data?.businessHours?.[day.key];
            return (
              <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-20 font-medium">{day.label}</div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dayData?.isOpen || false}
                    onCheckedChange={(checked) => {
                      const updated = {
                        ...data.businessHours,
                        [day.key]: {
                          ...dayData,
                          isOpen: checked
                        }
                      };
                      updateField('businessHours', updated);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {dayData?.isOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>
                {dayData?.isOpen && (
                  <div className="flex items-center gap-2 ml-4">
                    <Input
                      type="time"
                      value={dayData.open || ''}
                      onChange={(e) => {
                        const updated = {
                          ...data.businessHours,
                          [day.key]: {
                            ...dayData,
                            open: e.target.value
                          }
                        };
                        updateField('businessHours', updated);
                      }}
                      className="w-24"
                    />
                    <span>à</span>
                    <Input
                      type="time"
                      value={dayData.close || ''}
                      onChange={(e) => {
                        const updated = {
                          ...data.businessHours,
                          [day.key]: {
                            ...dayData,
                            close: e.target.value
                          }
                        };
                        updateField('businessHours', updated);
                      }}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Configuration fiscale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Configuration fiscale
          </CardTitle>
          <CardDescription>
            Gérez les taxes et la devise de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={data?.currency || 'EUR'} onValueChange={(value) => updateField('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Taux de TVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={data?.taxSettings?.defaultTaxRate || ''}
                onChange={(e) => updateNestedField('taxSettings', 'defaultTaxRate', parseFloat(e.target.value))}
                placeholder="20"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxName">Nom de la taxe</Label>
              <Input
                id="taxName"
                value={data?.taxSettings?.taxName || ''}
                onChange={(e) => updateNestedField('taxSettings', 'taxName', e.target.value)}
                placeholder="TVA"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={data?.taxSettings?.taxIncluded || false}
              onCheckedChange={(checked) => updateNestedField('taxSettings', 'taxIncluded', checked)}
            />
            <Label>Prix TTC (taxes incluses)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Réseaux sociaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Réseaux sociaux
          </CardTitle>
          <CardDescription>
            Ajoutez vos liens vers les réseaux sociaux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={data?.socialMedia?.facebook || ''}
                onChange={(e) => updateNestedField('socialMedia', 'facebook', e.target.value)}
                placeholder="https://facebook.com/mario-pizza"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={data?.socialMedia?.instagram || ''}
                onChange={(e) => updateNestedField('socialMedia', 'instagram', e.target.value)}
                placeholder="@mario_pizza_paris"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter/X</Label>
            <Input
              id="twitter"
              value={data?.socialMedia?.twitter || ''}
              onChange={(e) => updateNestedField('socialMedia', 'twitter', e.target.value)}
              placeholder="@mario_pizza"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={saveStoreData} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Settings className="h-4 w-4" />
          )}
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
}