'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Globe, 
  FileSpreadsheet,
  Camera,
  Wand2,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceImportProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  businessCategory: string;
  onImportComplete: () => void;
}

interface ImportResult {
  serviceName: string;
  categories: Array<{
    name: string;
    description: string;
    products: Array<{
      name: string;
      description: string;
      pricing: any;
      specifications?: any;
    }>;
  }>;
}

export default function ServiceImport({ 
  isOpen, 
  onClose, 
  storeId, 
  businessCategory, 
  onImportComplete 
}: ServiceImportProps) {
  const [activeTab, setActiveTab] = useState('url');
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState<ImportResult | null>(null);
  
  // États pour les différents modes d'import
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [catalogText, setCatalogText] = useState('');

  const handleWebsiteImport = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Veuillez saisir une URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/services/import/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          url: websiteUrl,
          businessCategory
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse du site web');
      }

      const data = await response.json();
      setImportData(data.result);
      toast.success('Site web analysé avec succès');
    } catch (error) {
      console.error('Error importing from website:', error);
      toast.error('Erreur lors de l\'analyse du site web');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async () => {
    if (!excelFile) {
      toast.error('Veuillez sélectionner un fichier Excel');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('storeId', storeId);
      formData.append('businessCategory', businessCategory);

      const response = await fetch('/api/services/import/excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse du fichier Excel');
      }

      const data = await response.json();
      setImportData(data.result);
      toast.success('Fichier Excel analysé avec succès');
    } catch (error) {
      console.error('Error importing from Excel:', error);
      toast.error('Erreur lors de l\'analyse du fichier Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleCatalogImport = async () => {
    if (!catalogText.trim()) {
      toast.error('Veuillez saisir le contenu de votre catalogue');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/services/import/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          content: catalogText,
          businessCategory
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse du catalogue');
      }

      const data = await response.json();
      setImportData(data.result);
      toast.success('Catalogue analysé avec succès');
    } catch (error) {
      console.error('Error importing from catalog:', error);
      toast.error('Erreur lors de l\'analyse du catalogue');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/services/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          importData
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création des services');
      }

      onImportComplete();
      onClose();
      setImportData(null);
      toast.success('Services importés avec succès');
    } catch (error) {
      console.error('Error confirming import:', error);
      toast.error('Erreur lors de la création des services');
    } finally {
      setLoading(false);
    }
  };

  const getBusinessExamples = () => {
    const examples: Record<string, { url: string; catalog: string }> = {
      AUTOMOTIVE: {
        url: 'https://www.europcar.fr',
        catalog: 'LOCATION VÉHICULES\n\nÉCONOMIQUE:\n- Citroën C3 - 35€/jour\n- Peugeot 208 - 40€/jour\n\nFAMILIALE:\n- Peugeot 3008 - 65€/jour\n- Citroën C5 Aircross - 70€/jour\n\nLUXE:\n- BMW X5 - 120€/jour\n- Audi Q7 - 140€/jour'
      },
      BEAUTY: {
        url: 'https://www.sephora.fr/services',
        catalog: 'SOINS VISAGE\n\nHYDRATANT:\n- Soin Hydratant Express 30min - 45€\n- Soin Hydratant Intensif 60min - 75€\n\nANTI-ÂGE:\n- Soin Anti-âge Lifting 45min - 85€\n- Soin Anti-âge Premium 75min - 120€\n\nPURIFIANT:\n- Nettoyage de peau 30min - 55€\n- Peeling + Hydratation 60min - 95€'
      },
      RESTAURANT: {
        url: 'https://www.restaurant-lecatering.fr',
        catalog: 'TABLES RESTAURANT\n\nSALLE PRINCIPALE:\n- Table 2 personnes - Gratuit\n- Table 4 personnes - Gratuit\n- Table 6 personnes - Gratuit\n\nSALON PRIVÉ:\n- Table VIP 8 personnes - 50€ réservation\n- Salon privé 12 personnes - 100€ réservation'
      }
    };

    return examples[businessCategory] || examples.RESTAURANT;
  };

  const examples = getBusinessExamples();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Import Intelligent de Services
          </DialogTitle>
        </DialogHeader>

        {!importData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site Web
              </TabsTrigger>
              <TabsTrigger value="excel" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </TabsTrigger>
              <TabsTrigger value="catalog" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Catalogue
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analyser un site web</CardTitle>
                  <CardDescription>
                    L'IA analyse automatiquement un site web pour extraire les services, catégories et prix
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">URL du site web</Label>
                    <Input
                      id="websiteUrl"
                      placeholder={examples.url}
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleWebsiteImport} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Analyser le site
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="excel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Importer depuis Excel</CardTitle>
                  <CardDescription>
                    Uploadez un fichier Excel avec vos services et prix
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="excelFile">Fichier Excel (.xlsx, .xls)</Label>
                    <Input
                      id="excelFile"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button 
                    onClick={handleExcelImport} 
                    disabled={loading || !excelFile}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Analyser le fichier
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Coller votre catalogue</CardTitle>
                  <CardDescription>
                    Copiez-collez le contenu de votre catalogue ou menu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="catalogText">Contenu du catalogue</Label>
                    <Textarea
                      id="catalogText"
                      placeholder={examples.catalog}
                      rows={10}
                      value={catalogText}
                      onChange={(e) => setCatalogText(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCatalogImport} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Analyser le catalogue
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Analyse terminée
                </CardTitle>
                <CardDescription>
                  Vérifiez les données extraites avant l'import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Service principal</h3>
                  <Badge variant="outline">{importData.serviceName}</Badge>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Catégories et produits détectés</h3>
                  <div className="space-y-3">
                    {importData.categories.map((category, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <h4 className="font-medium text-sm mb-2">{category.name}</h4>
                          <p className="text-xs text-muted-foreground mb-3">{category.description}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {category.products.map((product, pidx) => (
                              <div key={pidx} className="p-2 bg-muted rounded text-xs">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-muted-foreground">{product.description}</div>
                                {product.pricing && (
                                  <div className="text-primary font-medium">
                                    {JSON.stringify(product.pricing)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setImportData(null)}
                  >
                    Modifier
                  </Button>
                  <Button 
                    onClick={handleConfirmImport} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      'Confirmer l\'import'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}