

'use client';

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
    ArrowUp,
    Calendar as CalendarIcon,
    Eye,
    Filter,
    Phone,
    Receipt,
    Star
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language-context";


const chartDataFr = [
  { name: "Jan", revenue: 2800 },
  { name: "Fev", revenue: 3200 },
  { name: "Mar", revenue: 2500 },
  { name: "Avr", revenue: 4100 },
  { name: "Mai", revenue: 3800 },
  { name: "Jui", revenue: 5200 },
]

const chartDataEn = [
  { name: "Jan", revenue: 2800 },
  { name: "Feb", revenue: 3200 },
  { name: "Mar", revenue: 2500 },
  { name: "Apr", revenue: 4100 },
  { name: "May", revenue: 3800 },
  { name: "Jun", revenue: 5200 },
]

type OrderItemCustomization = {
    type: 'add' | 'remove';
    name: string;
    price?: number;
};

type DetailedOrderItem = {
    id: string;
    name: string;
    quantity: number;
    basePrice: number;
    customizations: OrderItemCustomization[];
    finalPrice: number; // basePrice + sum of customization prices
};

type DetailedOrder = {
    id: string;
    date: string;
    customerPhone: string;
    items: DetailedOrderItem[];
    subtotal: number;
    tax: number;
    taxRate: number;
    total: number;
    storeId: string;
};


type Customer = {
    phone: string;
    name?: string;
    status: 'Nouveau' | 'Fidèle' | 'VIP';
    avgBasket: string;
    totalSpent: string;
    firstSeen: string;
    lastSeen: string;
    orderHistory: DetailedOrder[];
    callHistory: { date: string; duration: string; type: 'Commande' | 'Info' }[];
};

const mockStores = [
    { id: "store-1", name: "Le Gourmet Parisien", address: "12 Rue de la Paix, 75002 Paris", taxRate: 10 },
    { id: "store-2", name: "Pizzeria Bella", address: "3 Rue de la Roquette, 75011 Paris", taxRate: 5.5 },
];


const customersData: Record<string, Customer> = {
    "0612345678": {
        phone: "06 12 34 56 78",
        name: "Alice Martin",
        status: "Fidèle",
        avgBasket: "72.50€",
        totalSpent: "870.00€",
        firstSeen: "12/01/2024",
        lastSeen: "28/05/2024",
        orderHistory: [],
        callHistory: []
    },
     "0787654321": {
        phone: "07 87 65 43 21",
        name: "Bob Dupont",
        status: "Nouveau",
        avgBasket: "57.90€",
        totalSpent: "57.90€",
        firstSeen: "27/05/2024",
        lastSeen: "27/05/2024",
        orderHistory: [],
        callHistory: []
    },
};

const recentOrders: DetailedOrder[] = [
    {
        id: "#1024",
        date: "28/05/2024 - 19:30",
        customerPhone: "0612345678",
        storeId: "store-1",
        items: [
            { id: "item-1", name: 'Burger "Le Personnalisé"', quantity: 1, basePrice: 16.50, customizations: [
                { type: 'add', name: 'Bacon grillé', price: 2.00 },
                { type: 'add', name: 'Oeuf au plat', price: 1.00 },
                { type: 'remove', name: 'Oignons' }
            ], finalPrice: 19.50 },
            { id: "item-2", name: 'Salade César', quantity: 1, basePrice: 12.50, customizations: [], finalPrice: 12.50 },
            { id: "item-5", name: 'Coca-Cola', quantity: 1, basePrice: 3.50, customizations: [], finalPrice: 3.50 },
        ],
        subtotal: 35.50,
        tax: 3.55,
        taxRate: 10,
        total: 39.05,
    },
    {
        id: "#1023",
        date: "27/05/2024 - 20:15",
        customerPhone: "0787654321",
        storeId: "store-2",
        items: [
            { id: "item-3", name: "Pizza Regina", quantity: 2, basePrice: 14.00, customizations: [
                { type: 'add', name: 'Extra Mozzarella', price: 2.00 },
            ], finalPrice: 16.00 }
        ],
        subtotal: 32.00,
        tax: 1.76,
        taxRate: 5.5,
        total: 33.76,
    },
    { id: "#1022", date: "27/05/2024 - 12:10", customerPhone: "0601020304", storeId: "store-1", items: [], subtotal: 22.50, tax: 2.25, taxRate: 10, total: 24.75 },
    { id: "#1021", date: "26/05/2024 - 19:50", customerPhone: "0655443322", storeId: "store-2", items: [], subtotal: 89.00, tax: 4.90, taxRate: 5.5, total: 93.90 },
];


const getStoreInfo = (storeId: string) => mockStores.find(s => s.id === storeId);

// Default customer for phones not in customersData
const defaultCustomer = (phone: string): Customer => ({
    phone: phone.replace(/(\d{2})(?=\d)/g, '$1 '),
    status: 'Nouveau',
    avgBasket: 'N/A',
    totalSpent: 'N/A',
    firstSeen: new Date().toLocaleDateString('fr-FR'),
    lastSeen: new Date().toLocaleDateString('fr-FR'),
    orderHistory: [],
    callHistory: []
})


export default function RestaurantDashboard() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isClientFileOpen, setClientFileOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
  const [isOrderTicketOpen, setOrderTicketOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const { language, t } = useLanguage();

  const handleViewClientFile = (phone: string) => {
    const customerData = customersData[phone] || defaultCustomer(phone);
    setSelectedCustomer(customerData);
    setClientFileOpen(true);
  };

  const handleViewOrderTicket = (order: DetailedOrder) => {
    setSelectedOrder(order);
    setOrderTicketOpen(true);
  }

  const translations = {
      dashboardTitle: { fr: "Tableau de Bord", en: "Dashboard" },
      dashboardSubtitle: { fr: "Voici un aperçu de la performance de votre restaurant.", en: "Here is an overview of your restaurant's performance." },
      filter: { fr: "Filtre", en: "Filter" },
      export: { fr: "Exporter", en: "Export" },
      totalRevenue: { fr: "Revenu Total", en: "Total Revenue" },
      sinceLastMonth: { fr: "depuis le mois dernier", en: "since last month" },
      orders: { fr: "Commandes", en: "Orders" },
      avgBasket: { fr: "Panier Moyen", en: "Average Basket" },
      uniqueCustomers: { fr: "Clients Uniques", en: "Unique Customers" },
      salesPerformance: { fr: "Performance des Ventes", en: "Sales Performance" },
      monthlyRevenue: { fr: "Revenus mensuels de votre restaurant.", en: "Monthly revenue of your restaurant." },
      recentOrders: { fr: "Commandes Récentes", en: "Recent Orders" },
      latestOrders: { fr: "Les dernières commandes passées par téléphone.", en: "The latest orders placed by phone." },
      items: { fr: "article(s)", en: "item(s)" },
      loyal: { fr: "Fidèle", en: "Loyal" },
      new: { fr: "Nouveau", en: "New" },
      customerFile: { fr: "Fiche Client", en: "Customer File" },
      status: { fr: "Statut", en: "Status" },
      totalSpent: { fr: "Total Dépensé", en: "Total Spent" },
      lastVisit: { fr: "Dernière Visite", en: "Last Visit" },
      orderHistory: { fr: "Historique des Commandes", en: "Order History" },
      callHistory: { fr: "Historique des Appels", en: "Call History" },
      chooseDate: { fr: "Choisir une date", en: "Choose a date" },
      order: { fr: "Commande", en: "Order" },
      dateLabel: { fr: "Date", en: "Date" },
      amount: { fr: "Montant", en: "Amount" },
      action: { fr: "Action", en: "Action" },
      noOrders: { fr: "Aucune commande", en: "No orders" },
      call: { fr: "Appel", en: "Call" },
      duration: { fr: "Durée", en: "Duration" },
      noCalls: { fr: "Aucun appel", en: "No calls" },
      sendSMS: { fr: "Envoyer un SMS", en: "Send SMS" },
      contactCustomer: { fr: "Contacter le client", en: "Contact Customer" },
      orderTicket: { fr: "Ticket de Commande", en: "Order Ticket" },
      print: { fr: "Imprimer", en: "Print" },
      subtotal: { fr: "SOUS-TOTAL", en: "SUBTOTAL" },
      tax: { fr: "TVA", en: "TAX" },
      total: { fr: "TOTAL", en: "TOTAL" },
      thankYou: { fr: "Merci de votre visite !", en: "Thank you for your visit!" },
  }
    
  return (
    <>
    <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t(translations.dashboardTitle)}</h2>
              <p className="text-muted-foreground">{t(translations.dashboardSubtitle)}</p>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {t(translations.filter)}
                </Button>
                <Button className="h-9">
                    {t(translations.export)}
                </Button>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t(translations.totalRevenue)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">21,495€</div>
                <div className="flex items-center text-xs text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>12% {t(translations.sinceLastMonth)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t(translations.orders)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">780</div>
                <div className="flex items-center text-xs text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>8.2% {t(translations.sinceLastMonth)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t(translations.avgBasket)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">27.55€</div>
                <div className="flex items-center text-xs text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>2.1% {t(translations.sinceLastMonth)}</span>
                </div>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t(translations.uniqueCustomers)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">482</div>
                 <div className="flex items-center text-xs text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>15% {t(translations.sinceLastMonth)}</span>
                </div>
              </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t(translations.salesPerformance)}</CardTitle>
                <CardDescription>{t(translations.monthlyRevenue)}</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={language === 'fr' ? chartDataFr : chartDataEn} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                        <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value/1000}k€`}
                        />
                        <Tooltip
                            cursor={{fill: 'hsl(var(--accent))', radius: 'var(--radius)'}}
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)"
                             }}
                        />
                        <Bar dataKey="revenue" name="Revenu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>

             <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{t(translations.recentOrders)}</CardTitle>
                <CardDescription>
                  {t(translations.latestOrders)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map(order => {
                    const customer = customersData[order.customerPhone] || defaultCustomer(order.customerPhone);
                    return (
                        <div key={order.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                                <AvatarFallback>{customer.name ? customer.name.slice(0,2) : customer.phone.slice(-2)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <p className="text-sm font-medium leading-none">
                                    {customer.phone}
                                    {customer.name && <span className="text-xs text-muted-foreground"> ({customer.name})</span>}
                                </p>
                                <div className="text-xs text-muted-foreground flex items-center">
                                  <span>{order.items.length} {t(translations.items)}</span>
                                  {customer.status && 
                                      <Badge variant="outline" className={`ml-2 ${customer.status === 'Fidèle' ? 'text-green-600 border-green-200' : ''}`}>
                                      {customer.status === 'Fidèle' ? t(translations.loyal) : t(translations.new)}
                                      </Badge>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                             <p className="text-sm font-bold">{order.total.toFixed(2)}€</p>
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewOrderTicket(order)}>
                                <Eye className="h-4 w-4"/>
                            </Button>
                        </div>
                        </div>
                    )
                   })}
                </div>
              </CardContent>
            </Card>
        </div>
    </div>
    {selectedCustomer && (
        <Dialog open={isClientFileOpen} onOpenChange={setClientFileOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                           <AvatarFallback>{selectedCustomer.name ? selectedCustomer.name.charAt(0) : selectedCustomer.phone.slice(-2)}</AvatarFallback>
                        </Avatar>
                        <div>
                         {selectedCustomer.name || "Client"}
                         <p className="text-lg font-normal text-muted-foreground">{selectedCustomer.phone}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t(translations.status)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold flex items-center gap-2"><Star className="text-yellow-500"/> {selectedCustomer.status === 'Fidèle' ? t(translations.loyal) : t(translations.new)}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t(translations.avgBasket)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{selectedCustomer.avgBasket}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t(translations.totalSpent)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{selectedCustomer.totalSpent}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t(translations.lastVisit)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{selectedCustomer.lastSeen}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold">{t(translations.orderHistory)}</h3>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className="w-[240px] justify-start text-left font-normal"
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>{t(translations.chooseDate)}</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t(translations.order)}</TableHead>
                                                <TableHead>{t(translations.dateLabel)}</TableHead>
                                                <TableHead>{t(translations.amount)}</TableHead>
                                                <TableHead className="text-right">{t(translations.action)}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedCustomer.orderHistory.length > 0 ? selectedCustomer.orderHistory.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">{order.id} ({order.items.length} {t(translations.items)})</TableCell>
                                                    <TableCell>{order.date}</TableCell>
                                                    <TableCell>{order.total.toFixed(2)}€</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewOrderTicket(order)}>
                                                            <Eye className="h-4 w-4"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center h-24">{t(translations.noOrders)}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3">{t(translations.callHistory)}</h3>
                             <Card>
                                <CardContent className="p-4 space-y-4">
                                     {selectedCustomer.callHistory.length > 0 ? selectedCustomer.callHistory.map((call, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-4 w-4 text-muted-foreground"/>
                                                <div>
                                                    <p className="font-medium">{call.date}</p>
                                                    <p className="text-xs text-muted-foreground">{call.type} - {t(translations.duration)}: {call.duration}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Eye className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                     )) : (
                                        <div className="text-center h-24 flex items-center justify-center text-sm text-muted-foreground">{t(translations.noCalls)}</div>
                                     )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                 <DialogFooter className="pt-4 border-t">
                    <Button variant="outline">{t(translations.sendSMS)}</Button>
                    <Button>{t(translations.contactCustomer)}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    {selectedOrder && (
        <Dialog open={isOrderTicketOpen} onOpenChange={setOrderTicketOpen}>
            <DialogContent className="sm:max-w-sm font-mono">
                <DialogHeader className="text-center space-y-2">
                    <div className="mx-auto">
                        <Receipt className="h-10 w-10"/>
                    </div>
                    <DialogTitle className="font-headline text-lg">{getStoreInfo(selectedOrder.storeId)?.name}</DialogTitle>
                    <DialogDescription className="text-xs">
                        {getStoreInfo(selectedOrder.storeId)?.address}<br />
                        {t(translations.order)} {selectedOrder.id} - {selectedOrder.date}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 my-4 text-xs">
                    <Separator className="border-dashed" />
                    {selectedOrder.items.map((item, index) => (
                        <div key={item.id + index}>
                            <div className="flex justify-between font-bold">
                                <span>{item.quantity}x {item.name}</span>
                                <span>{item.finalPrice.toFixed(2)}€</span>
                            </div>
                            {item.customizations.length > 0 && (
                                <div className="pl-4 mt-1 space-y-1">
                                    {item.customizations.map((cust, cIndex) => (
                                        <div key={cIndex} className={`flex justify-between ${cust.type === 'remove' ? 'text-red-500' : ''}`}>
                                            <span>{cust.type === 'add' ? '+' : '-'} {cust.name}</span>
                                            {cust.price && <span>{cust.price.toFixed(2)}€</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <Separator className="border-dashed" />
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>{t(translations.subtotal)}</span>
                            <span>{selectedOrder.subtotal.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{t(translations.tax)} ({selectedOrder.taxRate}%)</span>
                            <span>{selectedOrder.tax.toFixed(2)}€</span>
                        </div>
                    </div>
                    <Separator className="border-dashed" />
                    <div className="flex justify-between font-bold text-base">
                        <span>{t(translations.total)}</span>
                        <span>{selectedOrder.total.toFixed(2)}€</span>
                    </div>
                     <Separator className="border-dashed" />
                     <div className="text-center text-gray-500 pt-2">
                        {t(translations.thankYou)}
                     </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" className="w-full font-sans">{t(translations.print)}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    </>
  );
}
