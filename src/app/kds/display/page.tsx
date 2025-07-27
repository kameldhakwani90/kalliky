
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowRight, Sun, Moon, Settings, ChefHat, ShoppingBag, Car, User, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

type OrderItem = {
  name: string;
  quantity: number;
  mods: string[];
};

type Order = {
  id: string;
  time: string;
  customer: {
      name: string;
      phone: string;
  };
  items: OrderItem[];
  status: 'pending' | 'in-progress' | 'ready';
  saleChannel: 'dine-in' | 'takeaway' | 'delivery';
};

const initialOrders: Order[] = [
  { id: '#1025', time: '12:38', customer: { name: 'Alice Martin', phone: '0612345678' }, items: [{ name: 'Salade Niçoise', quantity: 1, mods: [] }], status: 'pending', saleChannel: 'dine-in' },
  { id: '#1024', time: '12:35', customer: { name: 'Bob Dupont', phone: '0787654321' }, items: [{ name: 'Pizza Margherita', quantity: 1, mods: [] }, { name: 'Coca-Cola', quantity: 2, mods: [] }], status: 'pending', saleChannel: 'takeaway' },
  { id: '#1023', time: '12:32', customer: { name: 'Carole Leblanc', phone: '0611223344' }, items: [{ name: 'Burger Le Classic', quantity: 1, mods: ['+ cheddar', '- oignons'] }], status: 'in-progress', saleChannel: 'delivery' },
  { id: '#1022', time: '12:15', customer: { name: 'David Petit', phone: '0699887766' }, items: [{ name: 'Salade César', quantity: 1, mods: ['sans gluten'] }, { name: 'Evian', quantity: 1, mods: [] }], status: 'in-progress', saleChannel: 'dine-in' },
  { id: '#1026', time: '12:40', customer: { name: 'Anonyme', phone: 'N/A' }, items: [{ name: 'Plat du jour', quantity: 2, mods: [] }], status: 'pending', saleChannel: 'delivery' },
  { id: '#1027', time: '12:42', customer: { name: 'Anonyme', phone: 'N/A' }, items: [{ name: 'Pâtes Carbonara', quantity: 1, mods: ['sans lardons'] }], status: 'pending', saleChannel: 'dine-in' },

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
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [theme, setTheme] = useState('light');
  const [visibleChannels, setVisibleChannels] = useState<Record<Order['saleChannel'], boolean>>({
      'dine-in': true,
      'takeaway': true,
      'delivery': true,
  });
  const [newOrderFlash, setNewOrderFlash] = useState(false);


  useEffect(() => {
    // Simulate new order arrival
    const interval = setInterval(() => {
      const newId = `#${Math.floor(1028 + Math.random() * 100)}`;
      const channels: Order['saleChannel'][] = ['dine-in', 'takeaway', 'delivery'];
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      const newOrder: Order = {
        id: newId,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        customer: { name: 'Nouveau Client', phone: '0600000000' },
        items: [{ name: 'Nouveau Plat', quantity: 1, mods: [] }],
        status: 'pending',
        saleChannel: randomChannel,
      };
      setOrders(prev => [newOrder, ...prev]);

      // Trigger visual notification
      setNewOrderFlash(true);
      setTimeout(() => setNewOrderFlash(false), 3000);

    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, []);

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

  const filteredOrders = orders.filter(order => visibleChannels[order.saleChannel]);

  return (
    <div className={cn(
        "flex h-screen w-full flex-col bg-muted/40 dark:bg-black transition-colors duration-500",
        newOrderFlash && 'bg-green-400 dark:bg-green-800'
    )}>
      <header className="flex h-16 items-center justify-between border-b bg-background px-4">
        <h1 className="text-2xl font-bold font-headline">KDS - Kalliky.ai</h1>
        <div className="flex items-center gap-2">
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
              {KDS_COLUMNS.pending.title}
            </h2>
            <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-2">
              {filteredOrders
                .filter(o => o.status === 'pending')
                .sort((a,b) => new Date(0,0,0, ...a.time.split(':').map(Number)).getTime() - new Date(0,0,0, ...b.time.split(':').map(Number)).getTime())
                .map(order => {
                    const orderDate = new Date();
                    orderDate.setHours(...order.time.split(':').map(Number) as [number, number], 0);
                    const isLate = (new Date().getTime() - orderDate.getTime()) > 10 * 60 * 1000;
                    const ChannelIcon = SALE_CHANNELS[order.saleChannel].icon;

                    return (
                       <Card key={order.id} id={`order-card-${order.id}`} className={cn(
                           "shadow-md transition-all bg-white text-black",
                           KDS_COLUMNS.pending.color,
                           {"bg-yellow-100 border-yellow-500": isLate}
                       )}>
                        <CardHeader className="p-3">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-xl font-bold">{order.id}</span>
                             <div className="flex items-center gap-2 text-gray-600">
                                <ChannelIcon className="h-5 w-5" />
                                <span className="text-lg font-semibold">{order.time}</span>
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
              {KDS_COLUMNS['in-progress'].title}
            </h2>
            <div className="flex-1 space-y-4 overflow-y-auto p-2">
              {filteredOrders
                .filter(o => o.status === 'in-progress')
                .sort((a,b) => new Date(0,0,0, ...a.time.split(':').map(Number)).getTime() - new Date(0,0,0, ...b.time.split(':').map(Number)).getTime())
                .map(order => {
                    const orderDate = new Date();
                    orderDate.setHours(...order.time.split(':').map(Number) as [number, number], 0);
                    const isLate = (new Date().getTime() - orderDate.getTime()) > 10 * 60 * 1000;
                    const ChannelIcon = SALE_CHANNELS[order.saleChannel].icon;

                    return (
                       <Card key={order.id} id={`order-card-${order.id}`} className={cn(
                           "shadow-md transition-all bg-white text-black",
                           KDS_COLUMNS['in-progress'].color,
                           {"bg-yellow-100 border-yellow-500": isLate}
                       )}>
                        <CardHeader className="p-3">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-xl font-bold">{order.id}</span>
                             <div className="flex items-center gap-2 text-gray-600">
                                <ChannelIcon className="h-5 w-5" />
                                <span className="text-lg font-semibold">{order.time}</span>
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
                              onClick={() => moveOrder(order.id, KDS_COLUMNS['in-progress'].next)}
                              variant={'secondary'}
                          >
                              Terminé <ArrowRight className="ml-2 h-4 w-4" />
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
