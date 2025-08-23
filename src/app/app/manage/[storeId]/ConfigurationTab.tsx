'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Clock, 
  Receipt, 
  MessageSquare,
  Settings,
  Loader2,
  ChefHat,
  Scissors,
  Car,
  Home,
  Briefcase,
  Sparkles,
  Save,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter
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

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeId}`);
      if (response.ok) {
        const storeInfo = await response.json();
        setData({
          id: storeInfo.id,
          name: storeInfo.name,
          email: storeInfo.email,
          phone: storeInfo.phone,
          website: storeInfo.website,
          description: storeInfo.description,
          address: storeInfo.address,
          city: storeInfo.city,
          country: storeInfo.country,
          businessCategory: storeInfo.businessCategory,
          businessType: storeInfo.business?.type,
          currency: storeInfo.currency || 'EUR',
          taxSettings: storeInfo.taxSettings || {
            defaultTaxRate: 20,
            taxName: 'TVA',
            taxIncluded: true
          },
          socialMedia: storeInfo.socialMedia || {},
          businessHours: storeInfo.businessHours || {},
          settings: storeInfo.settings || {},
          isActive: storeInfo.isActive
        });
      }
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
      
      // Sauvegarde store
      const storeResponse = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          website: data.website,
          description: data.description,
          address: data.address,
          city: data.city,
          country: data.country,
          businessCategory: data.businessCategory,
          currency: data.currency,
          taxSettings: data.taxSettings,
          socialMedia: data.socialMedia,
          businessHours: data.businessHours,
          isActive: data.isActive,
          settings: data.settings
        })
      });

      if (storeResponse.ok && onConfigUpdate) {
        await onConfigUpdate(data);
      }
      
      toast.success('Configuration sauvegardée avec succès');
      loadStoreData(); // Recharger les données
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white mx-auto" />
          <p className="text-white/70 text-lg">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  const businessCategories = [
    { value: 'RESTAURANT', label: 'Restaurant', icon: ChefHat, color: 'from-orange-500 to-red-600' },
    { value: 'BEAUTY', label: 'Salon de Beauté', icon: Scissors, color: 'from-pink-500 to-purple-600' },
    { value: 'HAIRDRESSER', label: 'Coiffeur', icon: Scissors, color: 'from-purple-500 to-pink-600' },
    { value: 'AUTOMOTIVE', label: 'Automobile', icon: Car, color: 'from-blue-500 to-cyan-600' },
    { value: 'PROFESSIONAL', label: 'Services Professionnels', icon: Briefcase, color: 'from-gray-500 to-gray-600' },
    { value: 'RETAIL', label: 'Commerce de Détail', icon: Store, color: 'from-green-500 to-emerald-600' },
    { value: 'SERVICES', label: 'Services', icon: Settings, color: 'from-indigo-500 to-blue-600' }
  ];

  const currentCategory = businessCategories.find(cat => cat.value === data?.businessCategory) || businessCategories[0];

  return (
    <div className="space-y-6">
      {/* Type de Business */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white/10 rounded-xl">
            <currentCategory.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Type de Business</h3>
            <p className="text-sm text-white/60">Sélectionnez le type de votre boutique</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {businessCategories.map((category) => {
            const Icon = category.icon;
            const isSelected = data?.businessCategory === category.value;
            
            return (
              <button
                key={category.value}
                onClick={() => updateField('businessCategory', category.value)}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isSelected 
                    ? 'bg-gradient-to-br ' + category.color + ' border-white/30 shadow-lg scale-105'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-white/70'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>
                    {category.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Informations générales */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white/10 rounded-xl">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Informations générales</h3>
            <p className="text-sm text-white/60">Gérez les informations de base de votre boutique</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Nom de la boutique</Label>
              <Input
                value={data?.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Ex: MARIO Pizza"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                type="email"
                value={data?.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contact@mario-pizza.fr"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Description</Label>
            <Textarea
              value={data?.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Décrivez votre boutique..."
              rows={3}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
              <Input
                value={data?.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+33 1 23 45 67 89"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site web
              </Label>
              <Input
                value={data?.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://mario-pizza.fr"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse
            </Label>
            <Textarea
              value={data?.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 Rue de la Pizza, 75001 Paris"
              rows={2}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Horaires d'ouverture */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white/10 rounded-xl">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Horaires d'ouverture</h3>
            <p className="text-sm text-white/60">Configurez les horaires d'ouverture de votre boutique</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {daysOfWeek.map((day) => {
            const dayData = data?.businessHours?.[day.key];
            return (
              <div key={day.key} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-20 font-medium text-white/90">{day.label}</div>
                <div className="flex items-center gap-3">
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
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <span className="text-sm text-white/60 w-16">
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
                      className="w-24 bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30"
                    />
                    <span className="text-white/60">à</span>
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
                      className="w-24 bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration fiscale */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white/10 rounded-xl">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Configuration fiscale</h3>
            <p className="text-sm text-white/60">Gérez les taxes et la devise de votre boutique</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Devise</Label>
              <Select value={data?.currency || 'EUR'} onValueChange={(value) => updateField('currency', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  <SelectItem value="EUR" className="text-white hover:bg-white/10">EUR (€)</SelectItem>
                  <SelectItem value="USD" className="text-white hover:bg-white/10">USD ($)</SelectItem>
                  <SelectItem value="GBP" className="text-white hover:bg-white/10">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Taux de TVA (%)</Label>
              <Input
                type="number"
                value={data?.taxSettings?.defaultTaxRate || ''}
                onChange={(e) => updateNestedField('taxSettings', 'defaultTaxRate', parseFloat(e.target.value))}
                placeholder="20"
                min="0"
                max="100"
                step="0.1"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Nom de la taxe</Label>
              <Input
                value={data?.taxSettings?.taxName || ''}
                onChange={(e) => updateNestedField('taxSettings', 'taxName', e.target.value)}
                placeholder="TVA"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
            <Switch
              checked={data?.taxSettings?.taxIncluded || false}
              onCheckedChange={(checked) => updateNestedField('taxSettings', 'taxIncluded', checked)}
              className="data-[state=checked]:bg-blue-500"
            />
            <Label className="text-white/80">Prix TTC (taxes incluses)</Label>
          </div>
        </div>
      </div>

      {/* Réseaux sociaux */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white/10 rounded-xl">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Réseaux sociaux</h3>
            <p className="text-sm text-white/60">Ajoutez vos liens vers les réseaux sociaux</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80 flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                value={data?.socialMedia?.facebook || ''}
                onChange={(e) => updateNestedField('socialMedia', 'facebook', e.target.value)}
                placeholder="https://facebook.com/mario-pizza"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80 flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                value={data?.socialMedia?.instagram || ''}
                onChange={(e) => updateNestedField('socialMedia', 'instagram', e.target.value)}
                placeholder="@mario_pizza_paris"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter/X
            </Label>
            <Input
              value={data?.socialMedia?.twitter || ''}
              onChange={(e) => updateNestedField('socialMedia', 'twitter', e.target.value)}
              placeholder="@mario_pizza"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
            />
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={saveStoreData} 
          disabled={saving} 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
}