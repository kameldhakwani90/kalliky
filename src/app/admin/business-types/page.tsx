'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, 
  Edit, 
  Plus, 
  Save, 
  Trash2,
  Eye,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessOption {
  key: string;
  label: string;
  type: 'boolean' | 'string' | 'number';
}

interface BusinessCategoryConfig {
  id: string;
  category: string;
  displayName: string;
  systemPrompt: string;
  defaultParams: Record<string, any>;
  availableOptions: BusinessOption[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const BUSINESS_CATEGORIES = [
  'RESTAURANT', 'BEAUTY', 'HAIRDRESSER', 'AUTOMOTIVE', 'PROFESSIONAL',
  'ENTERTAINMENT', 'HEALTH', 'RETAIL', 'SERVICES', 'MEDICAL',
  'LEGAL', 'FITNESS', 'EDUCATION', 'TRANSPORT', 'IMMOBILIER'
];

export default function BusinessTypesPage() {
  const [configs, setConfigs] = useState<BusinessCategoryConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<BusinessCategoryConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Formulaire pour nouveau métier
  const [newConfig, setNewConfig] = useState({
    category: '',
    displayName: '',
    systemPrompt: '',
    defaultParams: {},
    availableOptions: [] as BusinessOption[]
  });

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/business-types');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error('Erreur chargement configs:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSaveConfig = async (config: BusinessCategoryConfig) => {
    try {
      const response = await fetch(`/api/admin/business-types/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        await fetchConfigs();
        setIsEditing(false);
        setSelectedConfig(null);
        toast.success('Configuration mise à jour');
      } else {
        throw new Error('Erreur sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleCreateConfig = async () => {
    try {
      const response = await fetch('/api/admin/business-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });

      if (response.ok) {
        await fetchConfigs();
        setIsCreating(false);
        setNewConfig({
          category: '',
          displayName: '',
          systemPrompt: '',
          defaultParams: {},
          availableOptions: []
        });
        toast.success('Nouveau métier créé');
      } else {
        throw new Error('Erreur création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleToggleActive = async (config: BusinessCategoryConfig) => {
    try {
      const response = await fetch(`/api/admin/business-types/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, isActive: !config.isActive })
      });

      if (response.ok) {
        await fetchConfigs();
        toast.success(`Métier ${config.isActive ? 'désactivé' : 'activé'}`);
      }
    } catch (error) {
      toast.error('Erreur mise à jour statut');
    }
  };

  const addNewOption = () => {
    if (selectedConfig) {
      const newOption: BusinessOption = {
        key: '',
        label: '',
        type: 'boolean'
      };
      setSelectedConfig({
        ...selectedConfig,
        availableOptions: [...selectedConfig.availableOptions, newOption]
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration Types Métiers</h1>
          <p className="text-muted-foreground">
            Gérez les prompts système et paramètres par type d'activité
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Métier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau type de métier</DialogTitle>
              <DialogDescription>
                Définissez les paramètres pour un nouveau secteur d'activité
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Select 
                    value={newConfig.category} 
                    onValueChange={(value) => setNewConfig({...newConfig, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES
                        .filter(cat => !configs.some(config => config.category === cat))
                        .map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nom d'affichage</Label>
                  <Input 
                    value={newConfig.displayName}
                    onChange={(e) => setNewConfig({...newConfig, displayName: e.target.value})}
                    placeholder="ex: Restaurant / Food"
                  />
                </div>
              </div>
              <div>
                <Label>Prompt système</Label>
                <Textarea 
                  value={newConfig.systemPrompt}
                  onChange={(e) => setNewConfig({...newConfig, systemPrompt: e.target.value})}
                  rows={8}
                  placeholder="Prompt système avec limite 3min..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateConfig}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {configs.map((config) => (
          <Card key={config.id} className={`transition-all ${!config.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.displayName}
                      {config.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Catégorie: {config.category} • 
                      {config.availableOptions.length} options • 
                      Modifié: {new Date(config.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleActive(config)}
                  >
                    {config.isActive ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedConfig(config);
                      setIsEditing(false);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedConfig(config);
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Prompt système (extrait)</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {config.systemPrompt.substring(0, 200)}...
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Options disponibles</h4>
                  <div className="flex flex-wrap gap-2">
                    {config.availableOptions.slice(0, 5).map((option, index) => (
                      <Badge key={index} variant="outline">
                        {option.label}
                      </Badge>
                    ))}
                    {config.availableOptions.length > 5 && (
                      <Badge variant="secondary">
                        +{config.availableOptions.length - 5} autres
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de détails/édition */}
      {selectedConfig && (
        <Dialog open={!!selectedConfig} onOpenChange={() => setSelectedConfig(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Modifier' : 'Détails'} - {selectedConfig.displayName}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="prompt" className="space-y-4">
              <TabsList>
                <TabsTrigger value="prompt">Prompt Système</TabsTrigger>
                <TabsTrigger value="params">Paramètres Défaut</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="space-y-4">
                <div>
                  <Label>Prompt système (limite 3min incluse)</Label>
                  <Textarea 
                    value={selectedConfig.systemPrompt}
                    onChange={(e) => isEditing && setSelectedConfig({
                      ...selectedConfig,
                      systemPrompt: e.target.value
                    })}
                    readOnly={!isEditing}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="params" className="space-y-4">
                <div>
                  <Label>Paramètres par défaut (JSON)</Label>
                  <Textarea 
                    value={JSON.stringify(selectedConfig.defaultParams, null, 2)}
                    onChange={(e) => {
                      if (isEditing) {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setSelectedConfig({
                            ...selectedConfig,
                            defaultParams: parsed
                          });
                        } catch {}
                      }
                    }}
                    readOnly={!isEditing}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Options configurables</Label>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={addNewOption}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Option
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {selectedConfig.availableOptions.map((option, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Clé</Label>
                          <Input 
                            value={option.key}
                            onChange={(e) => {
                              if (isEditing) {
                                const updated = [...selectedConfig.availableOptions];
                                updated[index] = { ...option, key: e.target.value };
                                setSelectedConfig({
                                  ...selectedConfig,
                                  availableOptions: updated
                                });
                              }
                            }}
                            readOnly={!isEditing}
                          />
                        </div>
                        <div>
                          <Label>Label</Label>
                          <Input 
                            value={option.label}
                            onChange={(e) => {
                              if (isEditing) {
                                const updated = [...selectedConfig.availableOptions];
                                updated[index] = { ...option, label: e.target.value };
                                setSelectedConfig({
                                  ...selectedConfig,
                                  availableOptions: updated
                                });
                              }
                            }}
                            readOnly={!isEditing}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>Type</Label>
                            <Select 
                              value={option.type} 
                              onValueChange={(value: 'boolean' | 'string' | 'number') => {
                                if (isEditing) {
                                  const updated = [...selectedConfig.availableOptions];
                                  updated[index] = { ...option, type: value };
                                  setSelectedConfig({
                                    ...selectedConfig,
                                    availableOptions: updated
                                  });
                                }
                              }}
                              disabled={!isEditing}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {isEditing && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const updated = selectedConfig.availableOptions.filter((_, i) => i !== index);
                                setSelectedConfig({
                                  ...selectedConfig,
                                  availableOptions: updated
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedConfig(null)}>
                Fermer
              </Button>
              {isEditing && (
                <Button onClick={() => handleSaveConfig(selectedConfig)}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}