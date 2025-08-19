'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  serviceCount: number;
  services: any[];
  isCustom?: boolean;
}

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: ServiceCategory | null;
  mode: 'create' | 'edit' | 'duplicate';
  onSave: (categoryData: ServiceCategory) => void;
}

// Icônes disponibles
const AVAILABLE_ICONS = [
  { icon: '🚗', name: 'Voiture' },
  { icon: '💅', name: 'Beauté' },
  { icon: '🏠', name: 'Maison' },
  { icon: '❤️', name: 'Santé' },
  { icon: '💪', name: 'Sport' },
  { icon: '🍽️', name: 'Restaurant' },
  { icon: '✂️', name: 'Coiffure' },
  { icon: '🔧', name: 'Réparation' },
  { icon: '🎓', name: 'Éducation' },
  { icon: '🎵', name: 'Musique' },
  { icon: '📷', name: 'Photo' },
  { icon: '⚙️', name: 'Autre' },
  { icon: '🎯', name: 'Objectif' },
  { icon: '💼', name: 'Business' },
  { icon: '🌟', name: 'Premium' }
];

// Couleurs disponibles
const AVAILABLE_COLORS = [
  'from-blue-500 to-blue-600',
  'from-pink-500 to-pink-600',
  'from-green-500 to-green-600',
  'from-red-500 to-red-600',
  'from-orange-500 to-orange-600',
  'from-yellow-500 to-yellow-600',
  'from-purple-500 to-purple-600',
  'from-gray-500 to-gray-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
  'from-cyan-500 to-cyan-600',
  'from-emerald-500 to-emerald-600'
];

export default function CategoryEditModal({ 
  isOpen, 
  onClose, 
  category, 
  mode, 
  onSave 
}: CategoryEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '⚙️',
    color: 'from-gray-500 to-gray-600'
  });

  useEffect(() => {
    if (category && isOpen) {
      if (mode === 'duplicate') {
        setFormData({
          name: `${category.name} (Copie)`,
          description: category.description,
          icon: category.icon,
          color: category.color
        });
      } else {
        setFormData({
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color
        });
      }
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        icon: '⚙️',
        color: 'from-gray-500 to-gray-600'
      });
    }
  }, [category, isOpen, mode]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    const newCategory: ServiceCategory = {
      id: mode === 'create' || mode === 'duplicate' 
        ? `custom_${Date.now()}` 
        : category!.id,
      name: formData.name.trim(),
      description: formData.description.trim(),
      icon: formData.icon,
      color: formData.color,
      serviceCount: mode === 'duplicate' ? 0 : (category?.serviceCount || 0),
      services: mode === 'duplicate' ? [] : (category?.services || []),
      isCustom: true
    };

    onSave(newCategory);
    onClose();
    
    const action = mode === 'create' ? 'créée' : 
                   mode === 'edit' ? 'modifiée' : 'dupliquée';
    toast.success(`Catégorie "${formData.name}" ${action} avec succès !`);
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Créer une nouvelle catégorie';
      case 'edit': return 'Modifier la catégorie';
      case 'duplicate': return 'Dupliquer la catégorie';
      default: return 'Catégorie';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de la catégorie *</Label>
              <Input
                id="name"
                placeholder="Ex: Location véhicules, Soins esthétiques..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description courte de cette catégorie..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Sélection d'icône */}
          <div>
            <Label>Icône de la catégorie</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {AVAILABLE_ICONS.map((iconData, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: iconData.icon })}
                  className={`
                    p-3 rounded-lg border-2 text-xl hover:bg-gray-50 transition-all
                    ${formData.icon === iconData.icon 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                    }
                  `}
                  title={iconData.name}
                >
                  {iconData.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Sélection de couleur */}
          <div>
            <Label>Couleur de la catégorie</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {AVAILABLE_COLORS.map((colorClass, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorClass })}
                  className={`
                    w-12 h-12 rounded-lg bg-gradient-to-br border-2 transition-all
                    ${colorClass}
                    ${formData.color === colorClass 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-200 hover:scale-105'
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Aperçu */}
          <div>
            <Label>Aperçu</Label>
            <Card className="mt-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-xl
                    ${formData.color}
                  `}>
                    {formData.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {formData.name || 'Nom de la catégorie'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.description || 'Description de la catégorie'}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {category?.serviceCount || 0} service{(category?.serviceCount || 0) > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            {mode === 'create' && 'Créer la catégorie'}
            {mode === 'edit' && 'Sauvegarder'}
            {mode === 'duplicate' && 'Dupliquer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}