import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle, CookingPot, Utensils, XCircle, Send } from 'lucide-react';

const orders = [
  {
    id: "#1024",
    time: "12:35",
    customer: "0612345678",
    status: "Payée",
    items: [
      { name: "Pizza Margherita", quantity: 1, mods: [] },
      { name: "Coca-Cola", quantity: 2, mods: [] },
    ],
    payment: { method: "Lien Stripe", status: "Payé" },
  },
  {
    id: "#1023",
    time: "12:32",
    customer: "0687654321",
    status: "En cours",
    items: [
      { name: "Burger Le Classic", quantity: 1, mods: ["+ cheddar", "- oignons"] },
    ],
    payment: { method: "Espèces", status: "En attente" },
  },
  {
    id: "#1022",
    time: "12:28",
    customer: "0711223344",
    status: "Prête",
    items: [
      { name: "Salade César", quantity: 1, mods: ["sans gluten"] },
      { name: "Evian", quantity: 1, mods: [] },
    ],
    payment: { method: "Lien Stripe", status: "Payé" },
  },
  {
    id: "#1021",
    time: "12:25",
    customer: "0699887766",
    status: "Annulée",
    items: [
      { name: "Menu Enfant", quantity: 1, mods: [] },
    ],
    payment: { method: "Lien Stripe", status: "Annulé" },
  },
];

const statusConfig = {
    'En attente': { icon: <Clock className="h-4 w-4" />, color: 'bg-gray-500' },
    'Payée': { icon: <CheckCircle className="h-4 w-4 text-green-600" />, color: 'bg-green-500' },
    'En cours': { icon: <CookingPot className="h-4 w-4 text-blue-600" />, color: 'bg-blue-500' },
    'Prête': { icon: <Utensils className="h-4 w-4 text-emerald-600" />, color: 'bg-emerald-500' },
    'Annulée': { icon: <XCircle className="h-4 w-4 text-red-600" />, color: 'bg-red-500' },
};


export default function RestaurantDashboard() {
  return (
    <div className="space-y-6">
        <header>
            <h1 className="text-3xl font-bold tracking-tight">Commandes en temps réel</h1>
            <p className="text-muted-foreground">Vue d'ensemble des commandes de votre restaurant.</p>
        </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {orders.map((order) => {
          const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig['En attente'];
          return (
            <Card key={order.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{order.id}</CardTitle>
                <Badge variant="outline" className="flex items-center gap-2">
                    <span className={ `h-2 w-2 rounded-full ${config.color}` }></span>
                    {order.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Heure: {order.time}</p>
                  <p>Client: {order.customer}</p>
                </div>
                <Separator />
                <div className="mt-4 space-y-2 text-sm">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between">
                        <span className="font-semibold">{item.quantity}x {item.name}</span>
                      </div>
                      {item.mods.length > 0 && (
                        <p className="text-xs text-muted-foreground pl-2">{item.mods.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                 <div className="w-full text-xs">
                    <p>Paiement: <span className="font-semibold">{order.payment.method}</span></p>
                    <p>Statut: <span className="font-semibold">{order.payment.status}</span></p>
                </div>
                {order.payment.method === "Lien Stripe" && order.payment.status !== "Payé" && (
                    <Button variant="outline" size="sm" className="w-full">
                        <Send className="h-3 w-3 mr-2" />
                        Renvoyer le lien de paiement
                    </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
