'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowRight, Sun, Moon } from 'lucide-react';

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
};

const initialOrders: Order[] = [
  { id: '#1025', time: '12:38', items: [{ name: 'Salade Niçoise', quantity: 1, mods: [] }], status: 'pending' },
  { id: '#1024', time: '12:35', items: [{ name: 'Pizza Margherita', quantity: 1, mods: [] }, { name: 'Coca-Cola', quantity: 2, mods: [] }], status: 'pending' },
  { id: '#1023', time: '12:32', items: [{ name: 'Burger Le Classic', quantity: 1, mods: ['+ cheddar', '- oignons'] }], status: 'in-progress' },
  { id: '#1022', time: '12:28', items: [{ name: 'Salade César', quantity: 1, mods: ['sans gluten'] }, { name: 'Evian', quantity: 1, mods: [] }], status: 'ready' },
];

const KDS_COLUMNS = {
  pending: { title: 'À Préparer', color: 'bg-gray-500 dark:bg-gray-600', next: 'in-progress' as const },
  'in-progress': { title: 'En Cours', color: 'bg-blue-500 dark:bg-blue-600', next: 'ready' as const },
  ready: { title: 'Prête', color: 'bg-green-500 dark:bg-green-600', next: null },
};

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Simulate new order arrival
    const interval = setInterval(() => {
      const newId = `#${Math.floor(1026 + Math.random() * 100)}`;
      const newOrder: Order = {
        id: newId,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        items: [{ name: 'Nouveau Plat', quantity: 1, mods: [] }],
        status: 'pending',
      };
      setOrders(prev => [newOrder, ...prev]);
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const moveOrder = (id: string, nextStatus: Order['status'] | null) => {
    if (!nextStatus) return;
    setOrders(prev =>
      prev.map(order => (order.id === id ? { ...order, status: nextStatus } : order))
    );
  };

  return (
    <div className="flex h-screen w-full flex-col bg-muted/40 dark:bg-black">
      <header className="flex h-16 items-center justify-between border-b bg-background px-4">
        <h1 className="text-2xl font-bold font-headline">KDS - Kalliky.ai</h1>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </header>

      <main className="flex-1 overflow-x-auto p-4">
        <div className="flex h-full min-w-max gap-4">
          {Object.entries(KDS_COLUMNS).map(([statusKey, config]) => (
            <div key={statusKey} className="flex h-full w-80 md:w-96 flex-col">
              <h2 className={`mb-2 rounded-t-lg p-2 text-center font-bold text-white ${config.color}`}>
                {config.title}
              </h2>
              <div className="flex-1 space-y-4 overflow-y-auto rounded-b-lg bg-background/50 p-2">
                {orders
                  .filter(o => o.status === statusKey)
                  .sort((a,b) => new Date(`1970/01/01 ${a.time}`).getTime() - new Date(`1970/01/01 ${b.time}`).getTime())
                  .map(order => (
                    <Card key={order.id} className={cn("shadow-md", {
                      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800': Date.now() - new Date(`1970/01/01 ${order.time}`).getTime() > 10 * 60 * 1000,
                    })}>
                      <CardHeader className="p-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-xl font-bold">{order.id}</span>
                          <span className="text-lg font-semibold">{order.time}</span>
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
                        {config.next && (
                          <Button
                            className="mt-4 w-full"
                            onClick={() => moveOrder(order.id, config.next)}
                          >
                            Suivant <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
