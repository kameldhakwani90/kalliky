
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowRight, Settings, ChefHat, ShoppingBag, Car, User, Phone, Clock, Bell, CircleSlash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type OrderItem = {
  name: string;
  quantity: number;
  mods: string[];
};

type Order = {
  id: string;
  receivedTime: number; // timestamp
  dueTime: number; // timestamp
  customer: {
      name: string;
      phone: string;
  };
  items: OrderItem[];
  status: 'pending' | 'in-progress' | 'ready';
  saleChannel: 'dine-in' | 'takeaway' | 'delivery';
};

const now = new Date().getTime();

const initialOrders: Order[] = [
  { id: '#1025', receivedTime: now - 60000 * 2, dueTime: now + 60000 * 13, customer: { name: 'Alice Martin', phone: '0612345678' }, items: [{ name: 'Salade Niçoise', quantity: 1, mods: [] }], status: 'pending', saleChannel: 'dine-in' },
  { id: '#1024', receivedTime: now - 60000 * 5, dueTime: now + 60000 * 25, customer: { name: 'Bob Dupont', phone: '0787654321' }, items: [{ name: 'Pizza Margherita', quantity: 1, mods: [] }, { name: 'Coca-Cola', quantity: 2, mods: [] }], status: 'pending', saleChannel: 'takeaway' },
  { id: '#1023', receivedTime: now - 60000 * 8, dueTime: now + 60000 * 7, customer: { name: 'Carole Leblanc', phone: '0611223344' }, items: [{ name: 'Burger Le Classic', quantity: 1, mods: ['+ cheddar', '- oignons'] }], status: 'in-progress', saleChannel: 'delivery' },
  { id: '#1022', receivedTime: now - 60000 * 25, dueTime: now + 60000 * 5, customer: { name: 'David Petit', phone: '0699887766' }, items: [{ name: 'Salade César', quantity: 1, mods: ['sans gluten'] }, { name: 'Evian', quantity: 1, mods: [] }], status: 'in-progress', saleChannel: 'dine-in' },
  // Scheduled orders for later
  { id: '#1026', receivedTime: now, dueTime: now + 60000 * 40, customer: { name: 'Anonyme', phone: 'N/A' }, items: [{ name: 'Plat du jour', quantity: 2, mods: [] }], status: 'pending', saleChannel: 'delivery' },
  { id: '#1027', receivedTime: now, dueTime: now + 60000 * 20, customer: { name: 'Anonyme', phone: 'N/A' }, items: [{ name: 'Pâtes Carbonara', quantity: 1, mods: ['sans lardons'] }], status: 'pending', saleChannel: 'dine-in' },
];

const KDS_COLUMNS = {
  pending: { title: 'À Préparer', color: 'border-t-4 border-red-500', next: 'in-progress' as const },
  'in-progress': { title: 'En Cours', color: 'border-t-4 border-green-500', next: 'ready' as const },
};

const SALE_CHANNELS = {
    'dine-in': { label: 'Sur Place', icon: ChefHat },
    'takeaway': { label: 'À Emporter', icon: ShoppingBag },
    'delivery': { label: 'Livraison', icon: Car },
}

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [theme, setTheme] = useState('light');
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const [prepTimes, setPrepTimes] = useState({
      'dine-in': 15,
      'takeaway': 20,
      'delivery': 30,
  });
   const [visibleChannels, setVisibleChannels] = useState<Record<Order['saleChannel'], boolean>>({
      'dine-in': true,
      'takeaway': true,
      'delivery': true,
  });
  const [isFutureOrdersDialogOpen, setFutureOrdersDialogOpen] = useState(false);

  // Separate state for orders that are not yet due to be prepared
  const [scheduledOrders, setScheduledOrders] = useState<Order[]>([]);

  const showOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
    setNewOrderFlash(true);
    setTimeout(() => setNewOrderFlash(false), 3000);
  };
  
  const forceShowOrder = (orderId: string) => {
    const orderToShow = scheduledOrders.find(o => o.id === orderId);
    if (orderToShow) {
      setScheduledOrders(prev => prev.filter(o => o.id !== orderId));
      showOrder(orderToShow);
    }
  };
  
  useEffect(() => {
    // Check for scheduled orders that need to be displayed
    const checkInterval = setInterval(() => {
      const nowTime = new Date().getTime();
      const newlyDueOrders: Order[] = [];

      setScheduledOrders(prev => {
        const remaining = prev.filter(order => {
          const prepTime = prepTimes[order.saleChannel] * 60000;
          if (order.dueTime - prepTime <= nowTime) {
            newlyDueOrders.push(order);
            return false;
          }
          return true;
        });
        return remaining;
      });

      if (newlyDueOrders.length > 0) {
        newlyDueOrders.forEach(showOrder);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [prepTimes]);


  useEffect(() => {
    // Separate orders into visible and scheduled on load and when prep times change
    const nowTime = new Date().getTime();
    const visible: Order[] = [];
    const scheduled: Order[] = [];

    initialOrders.forEach(order => {
        const prepTime = prepTimes[order.saleChannel] * 60000;
        if (order.dueTime - prepTime <= nowTime || order.status !== 'pending') {
            visible.push(order);
        } else {
            scheduled.push(order);
        }
    });

    setOrders(visible);
    setScheduledOrders(scheduled);
  }, []); // Only run once on mount for initial setup


  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('kds-theme') || 'light';
        setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kds-theme', theme);
  }, [theme]);

  const moveOrder = (id: string, nextStatus: Order['status'] | 'remove') => {
    if (nextStatus === 'remove') {
        const cardElement = document.getElementById(`order-card-${id}`);
        if(cardElement) {
            cardElement.classList.add('animate-fade-out');
            setTimeout(() => {
                 setOrders(prev => prev.filter(order => order.id !== id));
            }, 500);
        } else {
             setOrders(prev => prev.filter(order => order.id !== id));
        }
    } else {
        setOrders(prev =>
            prev.map(order => (order.id === id ? { ...order, status: nextStatus } : order))
        );
    }
  };
  
  const handleChannelVisibilityChange = (channel: Order['saleChannel'], checked: boolean) => {
      setVisibleChannels(prev => ({...prev, [channel]: checked}));
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => visibleChannels[order.saleChannel]);
  }, [orders, visibleChannels]);

  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col bg-muted/40 transition-colors duration-500 dark:bg-black',
        newOrderFlash && 'bg-green-400 dark:bg-green-800'
      )}
    >
      <header className="flex h-16 items-center justify-between border-b bg-background px-4">
        <h1 className="text-2xl font-bold font-headline">KDS - Kalliky.ai</h1>
        <div className="flex items-center gap-2">

             <Dialog open={isFutureOrdersDialogOpen} onOpenChange={setFutureOrdersDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="relative">
                        <Bell className="h-5 w-5 mr-2" />
                        Commandes en attente
                        {scheduledOrders.length > 0 && 
                            <Badge className="absolute -top-2 -right-2">{scheduledOrders.length}</Badge>
                        }
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Commandes en attente d'affichage</DialogTitle>
                        <DialogDescription>
                            Ces commandes apparaîtront automatiquement à l'heure de préparation calculée.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        {scheduledOrders.length > 0 ? (
                           <ul className="space-y-3 py-4">
                            {scheduledOrders
                                .sort((a,b) => a.dueTime - b.dueTime)
                                .map(order => (
                                <li key={order.id} className="flex items-center justify-between text-sm">
                                    <div className="font-medium">
                                        <p>{order.id} - {order.customer.name}</p>
                                        <p className="text-xs text-muted-foreground">Prévue pour {new Date(order.dueTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => forceShowOrder(order.id)}>
                                        Préparer maintenant
                                    </Button>
                                </li>
                            ))}
                           </ul>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <CircleSlash className="mx-auto h-12 w-12" />
                                <p className="mt-4">Aucune commande en attente.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Paramètres du KDS</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <Label>Temps de préparation (en minutes)</Label>
                            <div className="grid grid-cols-3 gap-4">
                               {Object.entries(prepTimes).map(([key, value]) => (
                                <div key={key} className="space-y-2">
                                    <Label htmlFor={`prep-${key}`} className="flex items-center gap-2 text-sm font-normal">
                                        {SALE_CHANNELS[key as Order['saleChannel']].icon && <SALE_CHANNELS[key as Order['saleChannel']].icon className="h-4 w-4"/>}
                                        {SALE_CHANNELS[key as Order['saleChannel']].label}
                                    </Label>
                                    <Input
                                        id={`prep-${key}`}
                                        type="number"
                                        value={value}
                                        onChange={(e) => setPrepTimes(prev => ({...prev, [key]: parseInt(e.target.value, 10) || 0}))}
                                    />
                                </div>
                               ))}
                            </div>
                        </div>

                        <Separator/>
                        
                        <div className="space-y-4">
                            <Label>Canaux de vente visibles</Label>
                            <div className="grid grid-cols-2 gap-4">
                               {Object.entries(SALE_CHANNELS).map(([key, {label, icon: Icon}]) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={key}
                                        checked={visibleChannels[key as Order['saleChannel']]}
                                        onCheckedChange={(checked) => handleChannelVisibilityChange(key as Order['saleChannel'], !!checked)}
                                    />
                                    <Label htmlFor={key} className="flex items-center gap-2 font-normal">
                                        <Icon className="h-4 w-4"/> {label}
                                    </Label>
                                </div>
                               ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                             <Label>Mode sombre</Label>
                             <Switch
                                checked={theme === 'dark'}
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                             />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-4">
        <div className="grid h-full min-w-max grid-cols-3 gap-4">
          
          <div className="col-span-2 flex h-full flex-col">
            <h2 className={`mb-2 rounded-lg p-2 text-center font-bold text-lg bg-card`}>
              {KDS_COLUMNS.pending.title} ({filteredOrders.filter(o => o.status === 'pending').length})
            </h2>
            <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-2">
              {filteredOrders
                .filter(o => o.status === 'pending')
                .sort((a,b) => a.dueTime - b.dueTime)
                .map(order => {
                    const isLate = new Date().getTime() > order.dueTime;
                    const ChannelIcon = SALE_CHANNELS[order.saleChannel].icon;

                    return (
                       <Card key={order.id} id={`order-card-${order.id}`} className={cn(
                           "shadow-md transition-all bg-white text-black",
                           KDS_COLUMNS.pending.color,
                           {"bg-pink-100 border-pink-500": isLate}
                       )}>
                        <CardHeader className="p-3">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-xl font-bold">{order.id}</span>
                             <div className="flex items-center gap-2 text-gray-600">
                                <ChannelIcon className="h-5 w-5" />
                                <Clock className="h-5 w-5" />
                                <span className="text-lg font-semibold">{new Date(order.dueTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </CardTitle>
                          <div className="text-sm text-gray-500 pt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4"/>
                                    <span>{order.customer.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4"/>
                                    <span>{order.customer.phone}</span>
                                </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3">
                          <Separator />
                          <div className="mt-3 space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i}>
                                <p className="text-lg font-semibold">
                                  {item.quantity}x {item.name}
                                </p>
                                {item.mods.length > 0 && (
                                  <p className="text-sm text-pink-600">
                                    {item.mods.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <Button
                              className="mt-4 w-full"
                              onClick={() => moveOrder(order.id, KDS_COLUMNS.pending.next)}
                              variant={'default'}
                          >
                              Commencer <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                         
                        </CardContent>
                      </Card>
                    )
                })}
            </div>
          </div>

          <div className="col-span-1 flex h-full flex-col">
            <h2 className={`mb-2 rounded-lg p-2 text-center font-bold text-lg bg-card`}>
              {KDS_COLUMNS['in-progress'].title} ({filteredOrders.filter(o => o.status === 'in-progress').length})
            </h2>
            <div className="flex-1 space-y-4 overflow-y-auto p-2">
              {filteredOrders
                .filter(o => o.status === 'in-progress')
                .sort((a,b) => a.dueTime - b.dueTime)
                .map(order => {
                    const isLate = new Date().getTime() > order.dueTime;
                    const ChannelIcon = SALE_CHANNELS[order.saleChannel].icon;

                    return (
                       <Card key={order.id} id={`order-card-${order.id}`} className={cn(
                           "shadow-md transition-all bg-white text-black",
                           KDS_COLUMNS['in-progress'].color,
                           {"bg-pink-100 border-pink-500": isLate}
                       )}>
                        <CardHeader className="p-3">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-xl font-bold">{order.id}</span>
                             <div className="flex items-center gap-2 text-gray-600">
                                <ChannelIcon className="h-5 w-5" />
                                <Clock className="h-5 w-5" />
                                <span className="text-lg font-semibold">{new Date(order.dueTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </CardTitle>
                           <div className="text-sm text-gray-500 pt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4"/>
                                    <span>{order.customer.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4"/>
                                    <span>{order.customer.phone}</span>
                                </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3">
                          <Separator />
                          <div className="mt-3 space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i}>
                                <p className="text-lg font-semibold">
                                  {item.quantity}x {item.name}
                                </p>
                                {item.mods.length > 0 && (
                                  <p className="text-sm text-pink-600">
                                    {item.mods.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                              className="mt-4 w-full bg-black text-white hover:bg-gray-800"
                              onClick={() => moveOrder(order.id, KDS_COLUMNS['in-progress'].next)}
                              variant={'secondary'}
                          >
                              <span className="text-red-500 mr-2 font-bold">Terminé</span> <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    )
                })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
