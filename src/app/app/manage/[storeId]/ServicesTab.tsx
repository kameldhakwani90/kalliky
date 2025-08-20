'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  Search, 
  Settings, 
  Calendar,
  Clock,
  Users,
  MapPin,
  Edit,
  Trash2,
  MoreVertical,
  Sparkles,
  Copy,
  Wand2
} from 'lucide-react';
import DomainesTab from './DomainesTab';

interface ServicesTabProps {
  storeId: string;
  storeName: string;
  config: any;
  onConfigUpdate: (config: any) => void;
}

export default function ServicesTab({ storeId, storeName, config, onConfigUpdate }: ServicesTabProps) {
  // Utiliser directement le nouveau composant domaines
  return (
    <DomainesTab 
      storeId={storeId} 
      storeName={storeName} 
      config={config} 
      onConfigUpdate={onConfigUpdate} 
    />
  );
}