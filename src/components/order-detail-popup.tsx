'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Wrench, Brain, AlertTriangle, Calendar, Clock, Euro, Package, CheckCircle, XCircle, TrendingUp, Phone, Mail, MapPin, User, CreditCard, Truck, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  customizations?: Array<{ type: string; name: string; price?: number }>;
  duration?: string;
  description?: string;
}

interface OrderSection {
  type: 'product' | 'service' | 'consultation' | 'report';
  category: string;
  items: OrderItem[];
  subtotal: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  store: {
    name: string;
    address: string;
  };
  items: OrderSection[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  deliveryInfo?: {
    type: string;
    address?: string;
    scheduledTime?: string;
  };
  notes?: string;
}

interface OrderDetailPopupProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const sectionIcons = {
  product: ShoppingBag,
  service: Wrench,
  consultation: Brain,
  report: AlertTriangle
};

const sectionColors = {
  product: 'from-blue-500 to-blue-600',
  service: 'from-green-500 to-green-600',
  consultation: 'from-purple-500 to-purple-600',
  report: 'from-red-500 to-red-600'
};

const sectionLabels = {
  product: 'Produits',
  service: 'Services',
  consultation: 'Consultations',
  report: 'Signalements'
};

export function OrderDetailPopup({ order, isOpen, onClose }: OrderDetailPopupProps) {
  if (!order) return null;

  const activeSections = order.items.filter(section => section.items.length > 0);
  const hasMultipleSections = activeSections.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        {/* Header moderne avec gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Commande {order.orderNumber}</h2>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {order.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  14:32
                </span>
                <Badge 
                  className={`
                    ${order.status === 'COMPLETED' ? 'bg-green-500' : ''}
                    ${order.status === 'PENDING' ? 'bg-yellow-500' : ''}
                    ${order.status === 'CANCELLED' ? 'bg-red-500' : ''}
                  `}
                >
                  {order.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{order.total.toFixed(2)}€</p>
              <p className="text-sm opacity-75">TTC</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Informations client et boutique */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.customer.phone}
                  </p>
                  {order.customer.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {order.customer.email}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Boutique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{order.store.name}</p>
                  <p className="text-sm text-muted-foreground">{order.store.address}</p>
                </CardContent>
              </Card>
            </div>

            {/* Sections de commande */}
            {hasMultipleSections ? (
              <Tabs defaultValue={activeSections[0].type} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${activeSections.length}, 1fr)` }}>
                  {activeSections.map(section => {
                    const Icon = sectionIcons[section.type];
                    return (
                      <TabsTrigger key={section.type} value={section.type} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {sectionLabels[section.type]}
                        <Badge variant="secondary" className="ml-1">
                          {section.items.length}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {activeSections.map(section => (
                  <TabsContent key={section.type} value={section.type}>
                    <OrderSectionContent section={section} />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <OrderSectionContent section={activeSections[0]} />
            )}

            {/* Récapitulatif financier moderne */}
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total HT</span>
                    <span>{(order.subtotal / (1 + order.taxRate/100)).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA ({order.taxRate}%)</span>
                    <span>{order.tax.toFixed(2)}€</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {order.total.toFixed(2)}€
                    </span>
                  </div>
                </div>

                {/* Méthode de paiement */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {order.paymentMethod === 'CARD' ? 'Carte bancaire' : 
                         order.paymentMethod === 'CASH' ? 'Espèces' : 
                         order.paymentMethod}
                      </span>
                    </div>
                    <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                      {order.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Imprimer
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Envoyer par email
              </Button>
              {order.status === 'PENDING' && (
                <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider la commande
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function OrderSectionContent({ section }: { section: OrderSection }) {
  const Icon = sectionIcons[section.type];
  const gradientColor = sectionColors[section.type];

  return (
    <Card>
      <CardHeader className={`bg-gradient-to-r ${gradientColor} text-white`}>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {sectionLabels[section.type]} - {section.category}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {section.items.map((item, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.duration && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.duration}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.customizations.map((custom, i) => (
                        <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className={custom.type === 'add' ? 'text-green-600' : 'text-red-600'}>
                            {custom.type === 'add' ? '+' : '-'}
                          </span>
                          <span>{custom.name}</span>
                          {custom.price && <span>({custom.price.toFixed(2)}€)</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                    <span className="font-medium">{item.total.toFixed(2)}€</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.price.toFixed(2)}€/u</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between font-medium">
            <span>Sous-total {sectionLabels[section.type]}</span>
            <span>{section.subtotal.toFixed(2)}€</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}