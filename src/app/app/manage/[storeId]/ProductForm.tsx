'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ImagePlus, 
  Ruler, 
  Box, 
  X, 
  Plus, 
  Upload,
  FileText,
  Layers,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ProductFormProps {
  product?: any;
  storeId: string;
  onSave: (productData: any) => void;
  onCancel: () => void;
  availableCategories?: string[];
}

interface Variation {
  id: string;
  name: string;
  prices?: any;
  uniformPrice?: number;
  // États d'édition pour UX fluide
  editingUniformPrice?: string;
  editingPrices?: Record<string, string>;
}

interface CompositionStep {
  id: string;
  title: string;
  isRequired: boolean;
  selectionType: 'single' | 'multiple';
  options: CompositionOption[];
}

interface CompositionOption {
  id: string;
  name: string;
  prices?: any;
  uniformPrice?: number;
}

interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "17:00"
}

interface DayAvailability {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface AvailabilitySchedule {
  enabled: boolean;
  days: {
    monday: DayAvailability;
    tuesday: DayAvailability;
    wednesday: DayAvailability;
    thursday: DayAvailability;
    friday: DayAvailability;
    saturday: DayAvailability;
    sunday: DayAvailability;
  };
}

// Composant d'auto-complétion pour les options
interface ComponentAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectComponent?: (component: any) => void;
  availableComponents: any[];
  placeholder?: string;
  className?: string;
}

function ComponentAutocomplete({ value, onChange, onSelectComponent, availableComponents, placeholder, className }: ComponentAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredComponents, setFilteredComponents] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const filtered = availableComponents.filter(component => 
        component.name.toLowerCase().includes(value.toLowerCase()) ||
        component.aliases.some((alias: string) => alias.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 5);
      setFilteredComponents(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, availableComponents]);

  const handleSelectComponent = (component: any) => {
    onChange(component.name);
    setShowSuggestions(false);
    onSelectComponent?.(component);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length >= 2 && setShowSuggestions(filteredComponents.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
              onClick={() => handleSelectComponent(component)}
            >
              <div className="font-medium">{component.name}</div>
              {component.category && (
                <div className="text-xs text-muted-foreground">
                  {component.category.name} • Utilisé {component.usageCount}x
                </div>
              )}
              {component.aliases.length > 0 && (
                <div className="text-xs text-blue-600">
                  Aussi: {component.aliases.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant pour gérer les horaires d'un jour
interface DayScheduleRowProps {
  dayKey: string;
  dayData: DayAvailability;
  onUpdate: (dayData: DayAvailability) => void;
}

function DayScheduleRow({ dayKey, dayData, onUpdate }: DayScheduleRowProps) {
  const dayNames: Record<string, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi', 
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = { start: '09:00', end: '17:00' };
    onUpdate({
      ...dayData,
      timeSlots: [...dayData.timeSlots, newSlot]
    });
  };

  const removeTimeSlot = (index: number) => {
    onUpdate({
      ...dayData,
      timeSlots: dayData.timeSlots.filter((_, i) => i !== index)
    });
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const updatedSlots = [...dayData.timeSlots];
    updatedSlots[index][field] = value;
    onUpdate({
      ...dayData,
      timeSlots: updatedSlots
    });
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-20 text-sm font-medium">{dayNames[dayKey]}</div>
      
      <Switch 
        checked={dayData.enabled}
        onCheckedChange={(enabled) => onUpdate({ ...dayData, enabled })}
        size="sm"
      />

      {dayData.enabled && (
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {dayData.timeSlots.map((slot, index) => (
            <div key={index} className="flex items-center gap-1 bg-background rounded px-2 py-1">
              <Input 
                type="time"
                value={slot.start}
                onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                className="w-20 h-6 text-xs border-0 p-1"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input 
                type="time"
                value={slot.end}
                onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                className="w-20 h-6 text-xs border-0 p-1"
              />
              {dayData.timeSlots.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeTimeSlot(index)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={addTimeSlot}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Plage
          </Button>
        </div>
      )}
    </div>
  );
}

// Composant pour le popup d'import AI
interface AIImportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onImportComplete?: () => void;
}

function AIImportPopup({ isOpen, onClose, storeId, onImportComplete }: AIImportPopupProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const handleFileUpload = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/jpg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez PDF, JPEG, PNG, Excel ou CSV.');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setProcessingStatus('📤 Upload en cours...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', storeId);
      formData.append('autoProcess', 'true');
      formData.append('extractComponents', 'true'); // Nouveau: extraire les composants

      const response = await fetch('/api/ai/menu-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      setProcessingStatus('🤖 Analyse IA en cours...');
      
      // Simuler le processus d'analyse
      setTimeout(() => {
        setProcessingStatus('🧩 Extraction des composants...');
      }, 2000);
      
      setTimeout(() => {
        setProcessingStatus('📂 Création des catégories...');
      }, 4000);
      
      setTimeout(() => {
        setProcessingStatus('✅ Import terminé !');
        toast.success('🎉 Menu analysé ! Produits et composants créés automatiquement.');
        onImportComplete?.();
        setTimeout(() => {
          onClose();
          setIsProcessing(false);
          setUploadedFile(null);
          setProcessingStatus('');
        }, 2000);
      }, 6000);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import AI');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🤖 Import AI - Menu & Composants
          </DialogTitle>
        </DialogHeader>
        
        {!isProcessing ? (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Uploadez votre menu (PDF, image, Excel) et notre IA va automatiquement :
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>🍽️ Extraire tous les produits avec prix</li>
                <li>🧩 Détecter les composants (salade, tomate, fromage...)</li>
                <li>📂 Créer les catégories de composants</li>
                <li>🔗 Lier les produits aux composants détectés</li>
              </ul>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium">Glissez votre fichier ici</p>
                  <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
                </div>
                <div className="flex justify-center gap-2 text-xs text-muted-foreground">
                  <span>📄 PDF</span>
                  <span>🖼️ JPEG/PNG</span>
                  <span>📊 Excel/CSV</span>
                </div>
              </div>
              
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-medium">Traitement IA en cours...</h3>
              <p className="text-sm text-muted-foreground mt-2">{processingStatus}</p>
            </div>
            
            {uploadedFile && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-medium">{uploadedFile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ProductForm({ product, storeId, onSave, onCancel, availableCategories }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    image: product?.image || '',
    status: product?.status || 'ACTIVE',
  });

  const [variations, setVariations] = useState<Variation[]>(
    product?.variations?.length > 0 
      ? product.variations.map((v: any) => ({
          id: v.id || `var-${Date.now()}`,
          name: v.name || 'Taille unique',
          prices: v.prices || { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 },
          uniformPrice: 0,
          editingUniformPrice: undefined,
          editingPrices: {}
        }))
      : [{ 
          id: `var-${Date.now()}`, 
          name: 'Taille unique', 
          prices: { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 },
          uniformPrice: 0,
          editingUniformPrice: undefined,
          editingPrices: {}
        }]
  );

  const [compositionSteps, setCompositionSteps] = useState<CompositionStep[]>(
    product?.composition || []
  );

  const [hasUniformPricing, setHasUniformPricing] = useState(false);
  const [hasMultipleSizes, setHasMultipleSizes] = useState(variations.length > 1);
  const [hasComposition, setHasComposition] = useState(compositionSteps.length > 0);

  // Charger les composants disponibles
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const response = await fetch(`/api/components?storeId=${storeId}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableComponents(data.components || []);
        }
      } catch (error) {
        console.error('Error fetching components:', error);
      }
    };
    
    fetchComponents();
  }, [storeId]);
  
  const categories = availableCategories || [
    'Plats principaux',
    'Entrées', 
    'Desserts',
    'Boissons',
    'Menus',
    'Snacks',
    'Salades'
  ];

  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  // État pour les composants disponibles
  const [availableComponents, setAvailableComponents] = useState<any[]>([]);
  
  // État pour le popup d'import AI
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);

  // État pour la planification de disponibilité
  const [availabilitySchedule, setAvailabilitySchedule] = useState<AvailabilitySchedule>(() => {
    // Essayer de récupérer depuis le produit existant
    const existingSchedule = product?.availabilitySchedule;
    if (existingSchedule && typeof existingSchedule === 'object') {
      return existingSchedule as AvailabilitySchedule;
    }

    // Valeurs par défaut
    const defaultDayAvailability: DayAvailability = {
      enabled: true,
      timeSlots: [{ start: '09:00', end: '22:00' }]
    };

    return {
      enabled: false, // Désactivé par défaut (utilise le status simple)
      days: {
        monday: defaultDayAvailability,
        tuesday: defaultDayAvailability,
        wednesday: defaultDayAvailability,
        thursday: defaultDayAvailability,
        friday: defaultDayAvailability,
        saturday: defaultDayAvailability,
        sunday: { enabled: false, timeSlots: [] }
      }
    };
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateVariation = (variationId: string, field: string, value: any) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId ? { ...v, [field]: value } : v
    ));
  };

  const updateVariationPrice = (variationId: string, channel: string, value: string) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId 
        ? { 
            ...v, 
            editingPrices: { ...v.editingPrices, [channel]: value },
            prices: { 
              ...v.prices, 
              [channel]: value === '' ? 0 : parseFloat(value) || v.prices?.[channel] || 0 
            }
          }
        : v
    ));
  };

  const finishEditingPrice = (variationId: string, channel: string) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId 
        ? { 
            ...v, 
            editingPrices: { ...v.editingPrices, [channel]: undefined },
            prices: {
              ...v.prices,
              [channel]: v.editingPrices?.[channel] ? parseFloat(v.editingPrices[channel]) || 0 : v.prices?.[channel] || 0
            }
          }
        : v
    ));
  };

  const updateUniformPrice = (variationId: string, value: string) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId ? { 
        ...v, 
        editingUniformPrice: value,
        uniformPrice: value === '' ? 0 : parseFloat(value) || v.uniformPrice || 0
      } : v
    ));
  };

  const finishEditingUniformPrice = (variationId: string) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId ? { 
        ...v, 
        editingUniformPrice: undefined,
        uniformPrice: v.editingUniformPrice ? parseFloat(v.editingUniformPrice) || 0 : v.uniformPrice || 0
      } : v
    ));
  };

  const addVariation = () => {
    const newVariation: Variation = {
      id: `var-${Date.now()}`,
      name: `Taille ${variations.length + 1}`,
      prices: { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 },
      uniformPrice: 0,
      editingUniformPrice: undefined,
      editingPrices: {}
    };
    setVariations(prev => [...prev, newVariation]);
  };

  const removeVariation = (variationId: string) => {
    if (variations.length > 1) {
      setVariations(prev => prev.filter(v => v.id !== variationId));
    }
  };

  const addCompositionStep = () => {
    const newStep: CompositionStep = {
      id: `step-${Date.now()}`,
      title: `Étape ${compositionSteps.length + 1}`,
      isRequired: true,
      selectionType: 'single',
      options: []
    };
    setCompositionSteps(prev => [...prev, newStep]);
  };

  const updateCompositionStep = (stepId: string, field: string, value: any) => {
    setCompositionSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };

  const removeCompositionStep = (stepId: string) => {
    setCompositionSteps(prev => prev.filter(step => step.id !== stepId));
  };

  const addCompositionOption = (stepId: string) => {
    const newOption: CompositionOption = {
      id: `opt-${Date.now()}`,
      name: '',
      prices: { 'dine-in': 0, 'takeaway': 0, 'delivery': 0, 'pickup': 0 },
      uniformPrice: 0
    };
    
    setCompositionSteps(prev => prev.map(step =>
      step.id === stepId 
        ? { ...step, options: [...step.options, newOption] }
        : step
    ));
  };

  const updateCompositionOption = (stepId: string, optionId: string, field: string, value: any) => {
    setCompositionSteps(prev => prev.map(step =>
      step.id === stepId 
        ? {
            ...step,
            options: step.options.map(option =>
              option.id === optionId ? { ...option, [field]: value } : option
            )
          }
        : step
    ));
  };

  const removeCompositionOption = (stepId: string, optionId: string) => {
    setCompositionSteps(prev => prev.map(step =>
      step.id === stepId 
        ? { ...step, options: step.options.filter(option => option.id !== optionId) }
        : step
    ));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleUniformPricingToggle = (checked: boolean) => {
    setHasUniformPricing(checked);
    if (checked) {
      // Reset all prices to uniform
      setVariations(prev => prev.map(v => ({
        ...v,
        uniformPrice: v.prices?.['dine-in'] || 0
      })));
    }
  };

  const handleMultipleSizesToggle = (checked: boolean) => {
    setHasMultipleSizes(checked);
    if (!checked && variations.length > 1) {
      // Keep only the first variation
      setVariations(prev => [prev[0]]);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Le nom du produit est requis');
      return;
    }

    if (!formData.category) {
      toast.error('Veuillez sélectionner une catégorie');
      return;
    }

    // Nettoyer et préparer les données à sauvegarder
    const cleanedVariations = variations.map(v => {
      // Finaliser toutes les éditions en cours
      const finalUniformPrice = v.editingUniformPrice !== undefined 
        ? parseFloat(v.editingUniformPrice) || 0 
        : v.uniformPrice || 0;
      
      const finalPrices = { ...v.prices };
      if (v.editingPrices) {
        Object.entries(v.editingPrices).forEach(([channel, value]) => {
          if (value !== undefined) {
            finalPrices[channel] = parseFloat(value) || 0;
          }
        });
      }

      return {
        name: v.name,
        prices: hasUniformPricing 
          ? { 'dine-in': finalUniformPrice, 'takeaway': finalUniformPrice, 'delivery': finalUniformPrice, 'pickup': finalUniformPrice }
          : finalPrices
      };
    });

    const productData = {
      ...formData,
      variations: cleanedVariations,
      composition: hasComposition ? compositionSteps : [],
      tags,
      hasComposition,
      availabilitySchedule
    };

    onSave(productData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.info('Upload d\'image en cours...');
      // TODO: Implémenter l'upload d'image
    }
  };

  const handleScanUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv';
    input.multiple = false;
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Valider le type de fichier
      const allowedTypes = [
        'application/pdf',
        'image/jpeg', 
        'image/jpg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Type de fichier non supporté. Utilisez PDF, JPEG, PNG, Excel ou CSV.');
        return;
      }

      try {
        toast.info('Analyse du fichier en cours...');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('storeId', storeId);
        formData.append('autoProcess', 'true');

        const response = await fetch('/api/ai/menu-upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erreur lors de l\'upload');
        }

        const result = await response.json();
        toast.success('Fichier traité avec succès! Vérifiez les produits extraits.');
        
        // Optionnel: recharger la liste des produits si on a une fonction de callback
        // onRefreshProducts?.();
        
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors du traitement du fichier');
      }
    };

    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche : Informations générales */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Image du produit */}
              <div className="space-y-2">
                <Label>Image du produit</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center">
                    {formData.image && formData.image.trim() && formData.image.startsWith('http') ? (
                      <Image src={formData.image} alt="" width={128} height={80} className="rounded-lg object-cover" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="URL de l'image..." 
                      value={formData.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('image-upload')?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsImportPopupOpen(true)}>
                        <FileText className="h-4 w-4 mr-2" />
                        🤖 Import AI
                      </Button>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Nom du produit */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input 
                  id="name"
                  placeholder="ex: Pizza Margherita"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Description du produit..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Disponibilité */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Disponibilité</Label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={formData.status === 'ACTIVE'}
                      onCheckedChange={(checked) => handleInputChange('status', checked ? 'ACTIVE' : 'INACTIVE')}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.status === 'ACTIVE' ? 'Produit disponible' : 'Produit indisponible'}
                    </span>
                  </div>
                </div>

                {formData.status === 'ACTIVE' && (
                  <div className="pl-4 border-l-2 border-muted space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Planning avancé</Label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={availabilitySchedule.enabled}
                          onCheckedChange={(checked) => 
                            setAvailabilitySchedule(prev => ({ ...prev, enabled: checked }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {availabilitySchedule.enabled ? 'Planning personnalisé' : 'Toujours disponible'}
                        </span>
                      </div>
                    </div>

                    {availabilitySchedule.enabled && (
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          Configurez les jours et horaires de disponibilité
                        </div>
                        {Object.entries(availabilitySchedule.days).map(([dayKey, dayData]) => (
                          <DayScheduleRow 
                            key={dayKey}
                            dayKey={dayKey}
                            dayData={dayData}
                            onUpdate={(updatedDay) => {
                              setAvailabilitySchedule(prev => ({
                                ...prev,
                                days: { ...prev.days, [dayKey]: updatedDay }
                              }));
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ajouter un tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Tailles & Tarifs */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-blue-600" />
                  Tailles & Tarifs
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">Prix unique</Label>
                    <Switch 
                      checked={hasUniformPricing}
                      onCheckedChange={handleUniformPricingToggle}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">Plusieurs tailles</Label>
                    <Switch 
                      checked={hasMultipleSizes}
                      onCheckedChange={handleMultipleSizesToggle}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* En-têtes des colonnes */}
                {hasUniformPricing ? (
                  <div className={`grid gap-3 text-xs font-semibold text-muted-foreground uppercase ${hasMultipleSizes ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div className="flex items-center gap-1">
                      <Box className="h-3 w-3" />
                      {hasMultipleSizes ? "Taille" : "Article"}
                    </div>
                    <div className="text-center">Prix unique</div>
                    {hasMultipleSizes && <div className="text-center">Actions</div>}
                  </div>
                ) : (
                  <div className={`grid gap-3 text-xs font-semibold text-muted-foreground uppercase ${hasMultipleSizes ? 'grid-cols-6' : 'grid-cols-5'}`}>
                    <div className="flex items-center gap-1">
                      <Box className="h-3 w-3" />
                      {hasMultipleSizes ? "Taille" : "Article"}
                    </div>
                    <div className="text-center">Sur Place</div>
                    <div className="text-center">À Emporter</div>
                    <div className="text-center">Livraison</div>
                    <div className="text-center">Collecte</div>
                    {hasMultipleSizes && <div className="text-center">Actions</div>}
                  </div>
                )}
                
                {/* Variations */}
                {variations.map((variation, index) => (
                  <div key={variation.id} className={`grid gap-3 items-center p-3 rounded-xl bg-muted/30 ${hasUniformPricing ? (hasMultipleSizes ? 'grid-cols-3' : 'grid-cols-2') : (hasMultipleSizes ? 'grid-cols-6' : 'grid-cols-5')}`}>
                    <div className="flex items-center gap-2">
                      {hasMultipleSizes ? (
                        <Input 
                          value={variation.name}
                          onChange={(e) => updateVariation(variation.id, 'name', e.target.value)}
                          className="text-sm font-medium border-0 bg-transparent"
                          placeholder="Nom de la taille"
                        />
                      ) : (
                        <div className="text-sm font-medium text-muted-foreground">
                          Prix standard
                        </div>
                      )}
                    </div>

                    {hasUniformPricing ? (
                      <>
                        <div className="relative flex items-center">
                          <Input 
                            type="text"
                            value={variation.editingUniformPrice !== undefined ? variation.editingUniformPrice : (variation.uniformPrice || '').toString()}
                            onChange={(e) => updateUniformPrice(variation.id, e.target.value)}
                            onBlur={() => finishEditingUniformPrice(variation.id)}
                            onFocus={(e) => {
                              const value = variation.uniformPrice?.toString() || '';
                              updateUniformPrice(variation.id, value);
                              // Sélectionner tout le texte pour faciliter l'édition
                              setTimeout(() => e.target.select(), 0);
                            }}
                            className="text-center text-sm border-0 bg-background/80 pr-8"
                            placeholder="0.00"
                          />
                          <span className="absolute right-2 text-xs text-muted-foreground">€</span>
                        </div>
                        {hasMultipleSizes && (
                          <div className="flex justify-center">
                            {variations.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeVariation(variation.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {['dine-in', 'takeaway', 'delivery', 'pickup'].map(channel => (
                          <div key={channel} className="relative flex items-center">
                            <Input 
                              type="text"
                              value={variation.editingPrices?.[channel] !== undefined ? variation.editingPrices[channel] : (variation.prices?.[channel] || '').toString()}
                              onChange={(e) => updateVariationPrice(variation.id, channel, e.target.value)}
                              onBlur={() => finishEditingPrice(variation.id, channel)}
                              onFocus={(e) => {
                                const value = variation.prices?.[channel]?.toString() || '';
                                updateVariationPrice(variation.id, channel, value);
                                // Sélectionner tout le texte pour faciliter l'édition
                                setTimeout(() => e.target.select(), 0);
                              }}
                              className="text-center text-sm border-0 bg-background/80 pr-8"
                              placeholder="0.00"
                            />
                            <span className="absolute right-2 text-xs text-muted-foreground">€</span>
                          </div>
                        ))}
                        {hasMultipleSizes && (
                          <div className="flex justify-center">
                            {variations.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeVariation(variation.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {hasMultipleSizes && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={addVariation}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une taille
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section Composition */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-600" />
                  Composition
                </CardTitle>
                <Switch 
                  checked={hasComposition}
                  onCheckedChange={setHasComposition}
                />
              </div>
            </CardHeader>
            {hasComposition && (
              <CardContent className="space-y-4">
                {compositionSteps.map((step) => (
                  <Card key={step.id} className="border-dashed">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Input 
                          placeholder="Nom de l'étape"
                          value={step.title}
                          onChange={(e) => updateCompositionStep(step.id, 'title', e.target.value)}
                          className="flex-1"
                        />
                        <div className="flex items-center space-x-2 ml-4">
                          <Label className="text-xs">Requis</Label>
                          <Switch 
                            checked={step.isRequired}
                            onCheckedChange={(checked) => updateCompositionStep(step.id, 'isRequired', checked)}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeCompositionStep(step.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {step.options.map((option) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <ComponentAutocomplete
                              value={option.name}
                              onChange={(value) => updateCompositionOption(step.id, option.id, 'name', value)}
                              onSelectComponent={(component) => {
                                // Auto-remplir le prix par défaut si disponible
                                if (component.defaultPrices) {
                                  updateCompositionOption(step.id, option.id, 'uniformPrice', component.defaultPrices.price || 0);
                                }
                              }}
                              availableComponents={availableComponents}
                              placeholder="Bo... → Bœuf cuit"
                              className="flex-1"
                            />
                            <Input 
                              type="number"
                              step="0.01"
                              value={option.uniformPrice || ''}
                              placeholder="Prix"
                              className="w-20"
                              onChange={(e) => updateCompositionOption(step.id, option.id, 'uniformPrice', parseFloat(e.target.value) || 0)}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeCompositionOption(step.id, option.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addCompositionOption(step.id)}
                          className="w-full border-dashed"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une option
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button 
                  variant="outline" 
                  onClick={addCompositionStep}
                  className="w-full border-dashed"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter une étape
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit}>
          {product ? 'Modifier' : 'Créer'} le produit
        </Button>
      </div>

      {/* Popup d'import AI */}
      <AIImportPopup
        isOpen={isImportPopupOpen}
        onClose={() => setIsImportPopupOpen(false)}
        storeId={storeId}
        onImportComplete={() => {
          // Recharger les composants après import
          fetch(`/api/components?storeId=${storeId}`)
            .then(res => res.json())
            .then(data => setAvailableComponents(data.components || []))
            .catch(console.error);
        }}
      />
    </div>
  );
}