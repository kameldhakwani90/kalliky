'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Wrench, 
  Plus, 
  Search,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { BusinessConfig } from '@/lib/constants/business-configs';

interface Resource {
  id: string;
  type: 'EMPLOYEE' | 'EQUIPMENT';
  name: string;
  description?: string;
  uniqueId?: string;
  isActive: boolean;
  specifications?: any;
  availability?: any;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  schedules?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
}

interface ResourcesSelectionSectionProps {
  storeId: string;
  serviceId?: string;
  wording: {
    products: string;
    equipment: string;
    staff: string;
    options: string;
  };
  businessConfig?: BusinessConfig;
}

export default function ResourcesSelectionSection({ 
  storeId, 
  serviceId, 
  wording, 
  businessConfig 
}: ResourcesSelectionSectionProps) {
  const [employees, setEmployees] = useState<Resource[]>([]);
  const [equipment, setEquipment] = useState<Resource[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('equipment');

  // Charger les ressources disponibles
  useEffect(() => {
    if (storeId) {
      loadResources();
    }
  }, [storeId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      
      // Charger employés
      const employeesResponse = await fetch(`/api/stores/${storeId}/employees`);
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.employees || []);
      }
      
      // Charger équipements
      const equipmentResponse = await fetch(`/api/stores/${storeId}/equipment`);
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData.equipment || []);
      }
      
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      toast.error('Erreur lors du chargement des ressources');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayIndex] || '';
  };

  const getAvailabilityBadge = (resource: Resource) => {
    if (!resource.schedules || resource.schedules.length === 0) {
      return (
        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
          Horaires non définis
        </Badge>
      );
    }

    const activeSchedules = resource.schedules.filter(s => s.isAvailable);
    if (activeSchedules.length === 0) {
      return (
        <Badge variant="outline" className="text-xs text-red-400 bg-red-900/20 border-red-600">
          Indisponible
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs text-green-400 bg-green-900/20 border-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        {activeSchedules.length} jour{activeSchedules.length > 1 ? 's' : ''}
      </Badge>
    );
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEquipment = equipment.filter(eq => 
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {!serviceId ? (
        <div className="text-center py-8 text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>Enregistrez d'abord les informations de base</p>
          <p className="text-sm">pour pouvoir affecter des ressources</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher employés ou ressources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-600">
              <TabsTrigger 
                value="equipment" 
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              >
                <Wrench className="h-4 w-4" />
                Ressources
                {filteredEquipment.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-slate-600 text-slate-300">
                    {filteredEquipment.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="employees" 
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
              >
                <Users className="h-4 w-4" />
                {wording.staff}
                {filteredEmployees.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-slate-600 text-slate-300">
                    {filteredEmployees.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Onglet Équipements */}
            <TabsContent value="equipment" className="mt-4">
              {filteredEquipment.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aucune ressource
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {searchTerm ? 'Aucune ressource ne correspond à votre recherche' : 'Ajoutez vos ressources depuis la gestion des ressources'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`/app/manage/${storeId}/resources`, '_blank')}
                    className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Gérer les ressources
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEquipment.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                        selectedEquipment.has(item.id) 
                          ? "border-blue-500 bg-blue-900/20 shadow-sm" 
                          : "border-slate-600 bg-slate-800 hover:border-slate-500"
                      )}
                      onClick={() => {
                        const newSelected = new Set(selectedEquipment);
                        if (newSelected.has(item.id)) {
                          newSelected.delete(item.id);
                        } else {
                          newSelected.add(item.id);
                        }
                        setSelectedEquipment(newSelected);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">{item.name}</h4>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              item.isActive ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                          
                          {item.uniqueId && (
                            <p className="text-sm text-slate-400 mb-1">ID: {item.uniqueId}</p>
                          )}
                          
                          {item.description && (
                            <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mb-2">
                            {getAvailabilityBadge(item)}
                            {item.specifications?.category && (
                              <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">
                                {item.specifications.category}
                              </Badge>
                            )}
                          </div>

                          {/* Spécifications techniques */}
                          {item.specifications && (
                            <div className="text-xs text-slate-400 space-y-1">
                              {item.specifications.brand && (
                                <div>Marque: {item.specifications.brand}</div>
                              )}
                              {item.specifications.model && (
                                <div>Modèle: {item.specifications.model}</div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {selectedEquipment.has(item.id) && (
                          <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Onglet Employés */}
            <TabsContent value="employees" className="mt-4">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600">
                  <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aucun employé
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {searchTerm ? 'Aucun employé ne correspond à votre recherche' : 'Ajoutez vos employés depuis la gestion du personnel'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`/app/manage/${storeId}/employees`, '_blank')}
                    className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Gérer les employés
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEmployees.map((employee) => (
                    <div 
                      key={employee.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                        selectedEmployees.has(employee.id) 
                          ? "border-blue-500 bg-blue-900/20 shadow-sm" 
                          : "border-slate-600 bg-slate-800 hover:border-slate-500"
                      )}
                      onClick={() => {
                        const newSelected = new Set(selectedEmployees);
                        if (newSelected.has(employee.id)) {
                          newSelected.delete(employee.id);
                        } else {
                          newSelected.add(employee.id);
                        }
                        setSelectedEmployees(newSelected);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">{employee.name}</h4>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              employee.isActive ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                          
                          {employee.uniqueId && (
                            <p className="text-sm text-slate-400 mb-1">ID: {employee.uniqueId}</p>
                          )}
                          
                          {employee.description && (
                            <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                              {employee.description}
                            </p>
                          )}

                          {/* Informations de contact */}
                          <div className="space-y-1 mb-2 text-xs text-slate-400">
                            {employee.contactInfo?.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{employee.contactInfo.email}</span>
                              </div>
                            )}
                            {employee.contactInfo?.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{employee.contactInfo.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Disponibilité */}
                          <div className="flex items-center gap-2">
                            {getAvailabilityBadge(employee)}
                            {employee.schedules && employee.schedules.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                {employee.schedules
                                  .filter(s => s.isAvailable)
                                  .map(s => getDayName(s.dayOfWeek))
                                  .join(', ')
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {selectedEmployees.has(employee.id) && (
                          <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Résumé sélection */}
          {(selectedEmployees.size > 0 || selectedEquipment.size > 0) && (
            <div className="mt-6 p-4 bg-blue-900/20 rounded-xl border border-blue-600">
              <h4 className="font-medium text-blue-300 mb-2">Ressources sélectionnées</h4>
              <div className="flex flex-wrap gap-2">
                {selectedEquipment.size > 0 && (
                  <Badge className="bg-blue-800 text-blue-300 border-blue-600">
                    <Wrench className="h-3 w-3 mr-1" />
                    {selectedEquipment.size} équipement{selectedEquipment.size > 1 ? 's' : ''}
                  </Badge>
                )}
                {selectedEmployees.size > 0 && (
                  <Badge className="bg-green-800 text-green-300 border-green-600">
                    <Users className="h-3 w-3 mr-1" />
                    {selectedEmployees.size} employé{selectedEmployees.size > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-blue-300 mt-2">
                Ces ressources seront les ressources principales de ce service
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}