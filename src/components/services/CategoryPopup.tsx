'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Plus,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: any) => void;
}

// Suggestions de catégories prédéfinies
const CATEGORY_SUGGESTIONS = [
  {
    id: 'vehicle_rental',
    name: 'Location véhicules',
    icon: '🚗',
    color: 'from-blue-500 to-blue-600',
    description: 'Voitures, motos, vélos...',
    examples: ['Location journée', 'Location weekend', 'Location longue durée']
  },
  {
    id: 'beauty_salon',
    name: 'Soins esthétiques',
    icon: '💅',
    color: 'from-pink-500 to-pink-600',
    description: 'Épilation, massage, manucure...',
    examples: ['Épilation jambes', 'Massage relaxant', 'Soin visage']
  },
  {
    id: 'home_services',
    name: 'Services à domicile',
    icon: '🏠',
    color: 'from-green-500 to-green-600',
    description: 'Ménage, jardinage, bricolage...',
    examples: ['Ménage', 'Jardinage', 'Réparations']
  },
  {
    id: 'health_wellness',
    name: 'Santé & Bien-être',
    icon: '❤️',
    color: 'from-red-500 to-red-600',
    description: 'Massage thérapeutique, yoga...',
    examples: ['Massage thérapeutique', 'Séance yoga', 'Consultation']
  },
  {
    id: 'fitness',
    name: 'Sport & Fitness',
    icon: '💪',
    color: 'from-orange-500 to-orange-600',
    description: 'Cours de sport, coaching...',
    examples: ['Cours collectif', 'Coaching personnel', 'Séance musculation']
  },
  {
    id: 'restaurant',
    name: 'Restauration',
    icon: '🍽️',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Plats, menus, livraison...',
    examples: ['Menu du jour', 'Plat à emporter', 'Livraison']
  },
  {
    id: 'hairdresser',
    name: 'Coiffure',
    icon: '✂️',
    color: 'from-purple-500 to-purple-600',
    description: 'Coupes, colorations, soins...',
    examples: ['Coupe femme', 'Coloration', 'Soin capillaire']
  },
  {
    id: 'repair',
    name: 'Réparation',
    icon: '🔧',
    color: 'from-gray-500 to-gray-600',
    description: 'Électronique, mécanique...',
    examples: ['Réparation phone', 'Diagnostic auto', 'Maintenance']
  },
  {
    id: 'education',
    name: 'Formation',
    icon: '🎓',
    color: 'from-indigo-500 to-indigo-600',
    description: 'Cours, formation, coaching...',
    examples: ['Cours particuliers', 'Formation pro', 'Coaching']
  },
  {
    id: 'entertainment',
    name: 'Divertissement',
    icon: '🎵',
    color: 'from-teal-500 to-teal-600',
    description: 'Événements, spectacles...',
    examples: ['Spectacle', 'Animation', 'Événement']
  },
  {
    id: 'photography',
    name: 'Photographie',
    icon: '📷',
    color: 'from-cyan-500 to-cyan-600',
    description: 'Séances photo, événements...',
    examples: ['Séance portrait', 'Mariage', 'Événement']
  }
];

export default function CategoryPopup({ isOpen, onClose, onSelectCategory }: CategoryPopupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState(CATEGORY_SUGGESTIONS);

  useEffect(() => {
    if (searchTerm) {
      const filtered = CATEGORY_SUGGESTIONS.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.examples.some(ex => ex.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(CATEGORY_SUGGESTIONS);
    }
  }, [searchTerm]);

  const handleCreateCustomCategory = () => {
    if (searchTerm.trim()) {
      const customCategory = {
        id: `custom_${Date.now()}`,
        name: searchTerm.trim(),
        icon: '⚙️',
        color: 'from-gray-400 to-gray-500',
        description: 'Catégorie personnalisée',
        examples: [],
        isCustom: true
      };
      onSelectCategory(customCategory);
      onClose();
      setSearchTerm('');
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    onSelectCategory(suggestion);
    onClose();
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter une catégorie</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher ou créer une catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Bouton créer catégorie personnalisée */}
          {searchTerm && !filteredSuggestions.some(s => s.name.toLowerCase() === searchTerm.toLowerCase()) && (
            <Card className="border-dashed border-2 border-blue-300 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-all" onClick={handleCreateCustomCategory}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">
                      Créer "{searchTerm}"
                    </h4>
                    <p className="text-sm text-blue-700">
                      Nouvelle catégorie personnalisée
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                {searchTerm ? 'Résultats' : 'Suggestions'}
              </Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {filteredSuggestions.map((suggestion) => {
                  return (
                    <Card 
                      key={suggestion.id}
                      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-xl",
                            suggestion.color
                          )}>
                            {suggestion.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{suggestion.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            {suggestion.examples.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {suggestion.examples.slice(0, 3).map((example, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {example}
                                  </Badge>
                                ))}
                                {suggestion.examples.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{suggestion.examples.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aucun résultat */}
          {filteredSuggestions.length === 0 && searchTerm && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune suggestion trouvée</p>
              <p className="text-sm">Vous pouvez créer une catégorie personnalisée</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}