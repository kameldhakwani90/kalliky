'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ServiceManageModal from '@/components/services/ServiceManageModal';
import { toast } from 'sonner';

// Types
interface UniversalService {
  id: string;
  name: string;
  description?: string;
  pattern: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  order: number;
  settings: any;
  _count?: {
    subServices: number;
    bookings: number;
    variants?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ServiceConfigPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<UniversalService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/universal-services/${serviceId}`);
      if (!response.ok) {
        throw new Error('Service non trouvé');
      }
      const data = await response.json();
      setService(data.service);
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Erreur lors du chargement du service');
      router.push(`/app/manage/${storeId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceUpdate = () => {
    fetchService(); // Recharger les données du service
  };

  const handleClose = () => {
    router.push(`/app/manage/${storeId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Service non trouvé</p>
          <Button onClick={() => router.push(`/app/manage/${storeId}`)}>
            Retour à la gestion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec bouton retour */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClose}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la gestion
            </Button>
          </div>
        </div>
      </div>

      {/* Interface de gestion avec le modal intégré */}
      <div className="p-6">
        <ServiceManageModal
          isOpen={true}
          onClose={handleClose}
          service={service}
          storeId={storeId}
          onServiceUpdate={handleServiceUpdate}
        />
      </div>
    </div>
  );
}