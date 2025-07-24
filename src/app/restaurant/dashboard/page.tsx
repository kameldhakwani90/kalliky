import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
    Clock, 
    CheckCircle, 
    CookingPot, 
    Utensils, 
    RefreshCw, 
    ChevronDown, 
    MoreVertical, 
    Circle,
    Bell,
    Settings,
    Link as LinkIcon,
    FileText,
    Power,
    HelpCircle,
    Wifi,
    BarChart2,
    Percent,
    Timer,
    Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const orders = [
  {
    id: "#1024",
    time: "28:47",
    items: [
      { name: "Item 1", price: "47.50€" },
      { name: "Item 2", price: "15.50€" },
    ],
    total: "67.00€",
    status: "awaiting_pay",
  },
  {
    id: "#1023",
    time: "28:42",
    items: [
      { name: "Item 1", price: "32.90€" },
      { name: "Item 2", price: "25.00€" },
    ],
    total: "57.90€",
    status: "paid",
  },
];

const quickActions = [
    { label: "Gestion du Menu", icon: CookingPot },
    { label: "Lien de Paiement", icon: LinkIcon },
    { label: "Historique Paiements", icon: FileText },
    { label: "Paramètres Restaurant", icon: Settings },
]


export default function RestaurantDashboard() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Tableau de Bord</h1>
                <div className="flex items-center gap-2">
                    <p className="text-sm">Menu ouvert</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">●</Badge>
                </div>
            </div>
        </header>

        <main className="flex-1 p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Commandes</h2>
                <div className="flex items-center gap-4">
                     <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button variant="outline" size="sm">
                        Plus récentes
                        <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">En attente</p>
                        <p className="text-2xl font-bold">1</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Payées</p>
                        <p className="text-2xl font-bold">1</p>
                    </CardContent>
                </Card>
                <Card>
                     <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">En prép.</p>
                        <p className="text-2xl font-bold">1</p>
                    </CardContent>
                </Card>
                <Card>
                     <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Prêtes</p>
                        <p className="text-2xl font-bold">1</p>
                    </CardContent>
                </Card>
            </div>

            {orders.map((order) => (
            <Card key={order.id}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                       <div className="space-y-2">
                            {order.items.map((item, index) => (
                                <p key={index} className="text-sm">{item.name}</p>
                            ))}
                       </div>
                       <div className="text-right">
                           <div className="flex items-center gap-4">
                                <p className="text-sm text-muted-foreground">{order.time}</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem>Voir détails</DropdownMenuItem>
                                        <DropdownMenuItem>Imprimer</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                           </div>
                            {order.items.map((item, index) => (
                                <p key={index} className="text-sm">{item.price}</p>
                            ))}
                       </div>
                    </div>
                    <Separator className="my-4"/>
                    <div className="flex justify-between items-center">
                        <div>
                             <Button variant="ghost" size="sm">Détails</Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-lg font-bold">{order.total}</p>
                             {order.status === 'awaiting_pay' ? (
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Awaiting Pay
                                </Button>
                            ) : (
                                <Button>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Paid
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            ))}
        </main>
      </div>

      <aside className="w-80 border-l flex flex-col">
          <header className="p-4 border-b h-[65px] flex items-center justify-between">
            <div className="font-semibold">Le Petit Bistro</div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon"><Bell className="h-5 w-5"/></Button>
                 <Button variant="ghost" size="icon"><Settings className="h-5 w-5"/></Button>
            </div>
          </header>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart2 className="h-5 w-5 text-muted-foreground"/>
                        Chiffre d'affaires
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">1 247,50 €</p>
                    <p className="text-xs text-muted-foreground">Niveau du jour</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Percent className="h-5 w-5 text-muted-foreground"/>
                        Commissions Kalliky
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">124,75 €</p>
                    <p className="text-xs text-muted-foreground">10.0% du CA</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground"/>
                        Paiements en attente
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">A traiter</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Timer className="h-5 w-5 text-muted-foreground"/>
                        Temps moyen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">18 min</p>
                    <p className="text-xs text-muted-foreground">Commande -> Prêt</p>
                </CardContent>
              </Card>

                <div>
                    <h3 className="text-sm font-semibold mb-2">Actions rapides</h3>
                    <div className="space-y-2">
                    {quickActions.map(action => (
                         <Button key={action.label} variant="outline" className="w-full justify-start">
                            <action.icon className="h-4 w-4 mr-2"/>
                            {action.label}
                        </Button>
                    ))}
                    </div>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold mb-2">Actions d'urgence</h3>
                    <div className="space-y-2">
                        <Button variant="destructive" className="w-full justify-start bg-orange-500 hover:bg-orange-600 text-white">
                            <Power className="h-4 w-4 mr-2"/>
                            Fermer temporairement
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            <HelpCircle className="h-4 w-4 mr-2"/>
                            Support technique
                        </Button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold mb-2">État du système</h3>
                    <Card>
                        <CardContent className="p-4 space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <p className="flex items-center gap-2"><Wifi className="h-4 w-4"/> WebSocket</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">Connecté</Badge>
                            </div>
                            <Separator/>
                             <div className="flex justify-between items-center">
                                <p>Santé du système</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">Opérationnel</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
          </div>
      </aside>
    </div>
  );
}
