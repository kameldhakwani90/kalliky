'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Users,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Clock,
  MoreVertical,
  UserCheck,
  UserX,
  CalendarX,
  CalendarPlus,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import EmployeeEditModal from '@/components/employees/EmployeeEditModal';
import EmployeeAvailabilityIndicator from '@/components/employees/EmployeeAvailabilityIndicator';
import AddEmployeeModal from '@/components/employees/AddEmployeeModal';

interface Employee {
  id: string;
  name: string;
  description?: string;
  uniqueId?: string;
  isActive: boolean;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  skills?: {
    certifications?: string[];
    specialties?: string[];
  };
  erpId?: string;
  schedules: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    notes?: string;
  }>;
  assignments: Array<{
    id: string;
    variant: {
      id: string;
      name: string;
      service: {
        id: string;
        name: string;
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface EmployeesTabProps {
  storeId: string;
  storeName: string;
}

const DAYS_OF_WEEK = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
];

const getStatusColor = (isActive: boolean) => 
  isActive ? 'bg-green-500' : 'bg-gray-400';

const getStatusLabel = (isActive: boolean) => 
  isActive ? 'Actif' : 'Inactif';

export default function EmployeesTab({ storeId, storeName }: EmployeesTabProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadEmployees();
  }, [storeId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeId}/employees`);
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur chargement employés:', error);
      toast.error('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeStatus = async (employee: Employee) => {
    const newIsActive = !employee.isActive;
    
    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newIsActive })
      });

      if (response.ok) {
        toast.success(`Employé ${newIsActive ? 'activé' : 'désactivé'}`);
        loadEmployees();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification employé:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const toggleTodayAbsence = async (employee: Employee) => {
    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}/absence-today`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success(`${employee.name} marqué ${employee.isActive ? 'absent' : 'présent'} aujourd'hui`);
        loadEmployees();
      } else {
        toast.error('Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const addLeave = async (employee: Employee) => {
    const startDate = prompt('Date de début de congé (YYYY-MM-DD):');
    if (!startDate) return;
    
    const endDate = prompt('Date de fin de congé (YYYY-MM-DD):', startDate);
    if (!endDate) return;
    
    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          type: 'VACATION',
          notes: 'Congés'
        })
      });

      if (response.ok) {
        toast.success('Congé ajouté');
        loadEmployees();
      } else {
        toast.error('Erreur lors de l\'ajout du congé');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout du congé');
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    if (!confirm(`Supprimer l'employé "${employee.name}" ?`)) return;

    try {
      const response = await fetch(`/api/stores/${storeId}/employees/${employee.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success(`Employé "${employee.name}" supprimé`);
        loadEmployees();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression employé:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getWorkingDays = (schedules: Employee['schedules']) => {
    if (!schedules || schedules.length === 0) return 'Horaires non définis';
    return schedules
      .filter(s => s.isAvailable)
      .map(s => DAYS_OF_WEEK[s.dayOfWeek])
      .join(', ');
  };

  const getAssignedServices = (assignments: Employee['assignments']) => {
    return assignments
      .map(a => a.variant.service.name)
      .filter((name, index, arr) => arr.indexOf(name) === index) // Unique
      .join(', ');
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des employés</h2>
          <p className="text-muted-foreground">
            Gérez vos employés, leurs horaires et compétences pour {storeName}
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un employé
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {employees.length} employé{employees.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des employés */}
      {filteredEmployees.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun employé trouvé</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Aucun employé ne correspond à votre recherche' : 'Commencez par ajouter votre premier employé'}
            </p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un employé
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      getStatusColor(employee.isActive)
                    )} />
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate">{employee.name}</CardTitle>
                      {employee.uniqueId && (
                        <p className="text-sm text-muted-foreground">{employee.uniqueId}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(employee.isActive)}
                    </Badge>
                    <EmployeeAvailabilityIndicator
                      employee={employee}
                      storeId={storeId}
                      showDetailed={false}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleEmployeeStatus(employee)}>
                          {employee.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openEditModal(employee)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteEmployee(employee)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {employee.description && (
                  <p className="text-sm text-muted-foreground">{employee.description}</p>
                )}

                {/* Contact */}
                <div className="space-y-2">
                  {employee.contactInfo?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{employee.contactInfo.email}</span>
                    </div>
                  )}
                  {employee.contactInfo?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{employee.contactInfo.phone}</span>
                    </div>
                  )}
                </div>

                {/* Planning complet disponible dans "Modifier" */}

                {/* Services assignés */}
                {employee.assignments.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-3 w-3" />
                      Services assignés
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getAssignedServices(employee.assignments)}
                    </p>
                  </div>
                )}

                {/* Compétences */}
                {employee.skills?.specialties && employee.skills.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {employee.skills.specialties.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {employee.skills.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{employee.skills.specialties.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Disponibilité détaillée */}
                {employee.isActive && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-3 w-3" />
                      Disponibilité
                    </div>
                    <EmployeeAvailabilityIndicator
                      employee={employee}
                      storeId={storeId}
                      showDetailed={true}
                    />
                  </div>
                )}
                
                {/* Actions rapides */}
                <div className="pt-3 border-t">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={!employee.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTodayAbsence(employee)}
                      className="h-7 text-xs"
                    >
                      {!employee.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Marquer présent
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Absent aujourd'hui
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(employee)}
                      className="h-7 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLeave(employee)}
                      className="h-7 text-xs"
                    >
                      <CalendarPlus className="h-3 w-3 mr-1" />
                      Congé
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal d'ajout d'employé */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        storeId={storeId}
        onEmployeeAdded={() => {
          loadEmployees();
        }}
      />
      
      {/* Modal d'édition d'employé */}
      {showEditModal && selectedEmployee && (
        <EmployeeEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          storeId={storeId}
          onUpdate={() => {
            loadEmployees();
          }}
        />
      )}
    </div>
  );
}