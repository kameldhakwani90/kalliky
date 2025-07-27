
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowRight, Sun, Moon, Settings, ChefHat, Takeaway, Car } from 'lucide-react';
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
  items: OrderItem[];
  status: 'pending' | 'in-progress' | 'ready';
  saleChannel: 'dine-in' | 'takeaway' | 'delivery';
};

const initialOrders: Order[] = [
  { id: '#1025', time: '12:38', items: [{ name: 'Salade Niçoise', quantity: 1, mods: [] }], status: 'pending', saleChannel: 'dine-in' },
  { id: '#1024', time: '12:35', items: [{ name: 'Pizza Margherita', quantity: 1, mods: [] }, { name: 'Coca-Cola', quantity: 2, mods: [] }], status: 'pending', saleChannel: 'takeaway' },
  { id: '#1023', time: '12:32', items: [{ name: 'Burger Le Classic', quantity: 1, mods: ['+ cheddar', '- oignons'] }], status: 'in-progress', saleChannel: 'delivery' },
  { id: '#1022', time: '12:15', items: [{ name: 'Salade César', quantity: 1, mods: ['sans gluten'] }, { name: 'Evian', quantity: 1, mods: [] }], status: 'in-progress', saleChannel: 'dine-in' },
];

const KDS_COLUMNS = {
  pending: { title: 'À Préparer', color: 'border-t-4 border-red-500', next: 'in-progress' as const },
  'in-progress': { title: 'En Cours', color: 'border-t-4 border-green-500', next: 'ready' as const },
};

const SALE_CHANNELS = {
    'dine-in': { label: 'Sur Place', icon: ChefHat },
    'takeaway': { label: 'À Emporter', icon: Takeaway },
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

  useEffect(() => {
    // Simulate new order arrival
    const interval = setInterval(() => {
      const newId = `#${Math.floor(1026 + Math.random() * 100)}`;
      const channels: Order['saleChannel'][] = ['dine-in', 'takeaway', 'delivery'];
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      const newOrder: Order = {
        id: newId,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        items: [{ name: 'Nouveau Plat', quantity: 1, mods: [] }],
        status: 'pending',
        saleChannel: randomChannel,
      };
      setOrders(prev => [newOrder, ...prev]);
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
        // Find the card element to apply exit animation
        const cardElement = document.getElementById(`order-card-${id}`);
        if(cardElement) {
            cardElement.classList.add('animate-fade-out');
            // Remove from state after animation
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
    <div className="flex h-screen w-full flex-col bg-muted/40 dark:bg-black">
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
        <div className="flex h-full min-w-max gap-4">
          {Object.entries(KDS_COLUMNS).map(([statusKey, config]) => (
            <div key={statusKey} className="flex h-full w-80 md:w-96 flex-col">
              <h2 className={`mb-2 rounded-lg p-2 text-center font-bold text-lg bg-card`}>
                {config.title}
              </h2>
              <div className="flex-1 space-y-4 overflow-y-auto p-2">
                {filteredOrders
                  .filter(o => o.status === statusKey)
                  .sort((a,b) => {
                      const timeA = a.time.split(':');
                      const timeB = b.time.split(':');
                      return new Date(0,0,0, Number(timeA[0]), Number(timeA[1])).getTime() - new Date(0,0,0, Number(timeB[0]), Number(timeB[1])).getTime()
                  })
                  .map(order => {
                      const orderTimeParts = order.time.split(':');
                      const orderDate = new Date();
                      orderDate.setHours(Number(orderTimeParts[0]), Number(orderTimeParts[1]), 0);

                      const isLate = (new Date().getTime() - orderDate.getTime()) > 10 * 60 * 1000;
                      const ChannelIcon = SALE_CHANNELS[order.saleChannel].icon;

                      return (
                         <Card key={order.id} id={`order-card-${order.id}`} className={cn(
                             "shadow-md transition-all",
                             config.color,
                             {"bg-yellow-100 border-yellow-500 dark:bg-yellow-900/20": isLate}
                         )}>
                          <CardHeader className="p-3">
                            <CardTitle className="flex items-center justify-between">
                              <span className="text-xl font-bold">{order.id}</span>
                               <div className="flex items-center gap-2">
                                  <ChannelIcon className="h-5 w-5 text-muted-foreground" />
                                  <span className="text-lg font-semibold">{order.time}</span>
                               </div>
                            </CardTitle>
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
                                    <p className="text-sm text-pink-600 dark:text-pink-400">
                                      {item.mods.join(', ')}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <Button
                                className="mt-4 w-full"
                                onClick={() => moveOrder(order.id, config.next ? config.next : 'remove')}
                                variant={config.next ? 'default' : 'secondary'}
                            >
                                {config.next ? `Commencer` : 'Terminé'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                           
                          </CardContent>
                        </Card>
                      )
                  })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
