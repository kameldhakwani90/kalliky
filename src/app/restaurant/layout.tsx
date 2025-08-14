
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  Settings,
  User,
  Store,
  Flag,
  Home,
  Receipt,
  XCircle,
  Bell,
  LayoutGrid,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

function KallikyLogo() {
    return (
      <div className="p-2">
        <Logo />
      </div>
    )
}

const notifications = [
    {
      id: 'notif-1',
      type: 'order',
      title: 'Nouvelle commande #1025',
      description: 'Alice Martin - 2 articles - 24,50€',
      time: 'il y a 2 minutes',
      link: '/restaurant/clients/cust-1'
    },
    {
      id: 'notif-2',
      type: 'report',
      title: 'Nouveau signalement',
      description: 'Carole Leblanc - Erreur dans la commande #1028',
      time: 'il y a 1 heure',
      link: '/restaurant/reports#rep-2'
    },
     {
      id: 'notif-3',
      type: 'order',
      title: 'Nouvelle commande #1024',
      description: 'Bob Dupont - 1 article - 18,00€',
      time: 'il y a 3 heures',
      link: '/restaurant/clients/cust-2'
    },
];

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [hasUnreadNotifications, setHasUnreadNotifications] = React.useState(true);

  const menuItems = [
    { href: "/restaurant/dashboard", label: {fr: "Aperçu", en: "Overview"}, icon: Home },
    { href: "/restaurant/activity", label: {fr: "Activité", en: "Activity"}, icon: LayoutGrid },
    { href: "/restaurant/clients", label: {fr: "Clients", en: "Customers"}, icon: User },
    { href: "/restaurant/reports", label: {fr: "Signalements", en: "Reports"}, icon: Flag },
    { href: "/restaurant/stores", label: {fr: "Configuration", en: "Settings"}, icon: Settings },
  ];
  
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="floating" side="left">
        <SidebarHeader>
           <KallikyLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={pathname.startsWith(item.href)}
                  tooltip={t(item.label)}
                  className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground font-semibold"
                >
                  <Link href={item.href}>
                    <item.icon />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b bg-card/50 px-6 backdrop-blur-md">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                {/* Optional Header Content */}
            </div>
             <DropdownMenu onOpenChange={(open) => {if(open) setHasUnreadNotifications(false)}}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                         {hasUnreadNotifications && <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>}
                        <span className="sr-only">Notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel>{t({fr: "Notifications", en: "Notifications"})}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.slice(0, 3).map((notif) => (
                         <DropdownMenuItem key={notif.id} asChild>
                          <Link href={notif.link} className="flex items-start gap-3 p-3 cursor-pointer">
                            <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback className={notif.type === 'order' ? 'bg-blue-100' : 'bg-red-100'}>
                                    {notif.type === 'order' ? <Receipt className="h-4 w-4 text-blue-600"/> : <Flag className="h-4 w-4 text-red-600"/>}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{notif.title}</p>
                                <p className="text-xs text-muted-foreground">{notif.description}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">{notif.time}</p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <Dialog>
                        <DialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="justify-center">
                                {t({fr: "Voir toutes les notifications", en: "See all notifications"})}
                             </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>{t({fr: "Toutes les notifications", en: "All Notifications"})}</DialogTitle>
                             </DialogHeader>
                             <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
                                {notifications.map((notif, index) => (
                                     <Link key={notif.id} href={notif.link} className={cn("flex items-start gap-3 p-3 cursor-pointer -mx-3", index > 0 && "border-t")}>
                                        <Avatar className="h-8 w-8 mt-1">
                                            <AvatarFallback className={notif.type === 'order' ? 'bg-blue-100' : 'bg-red-100'}>
                                                {notif.type === 'order' ? <Receipt className="h-4 w-4 text-blue-600"/> : <Flag className="h-4 w-4 text-red-600"/>}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{notif.title}</p>
                                            <p className="text-xs text-muted-foreground">{notif.description}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">{notif.time}</p>
                                        </div>
                                      </Link>
                                ))}
                             </div>
                        </DialogContent>
                    </Dialog>
                </DropdownMenuContent>
             </DropdownMenu>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar className="h-9 w-9 cursor-pointer">
                        <AvatarImage src="https://placehold.co/100x100" data-ai-hint="restaurant owner" />
                        <AvatarFallback>LP</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>{t({fr: "Mon Compte", en: "My Account"})}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/restaurant/profile">
                            <User className="mr-2 h-4 w-4" />
                            <span>{t({fr: "Profil", en: "Profile"})}</span>
                        </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href="/restaurant/billing">
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>{t({fr: "Facturation", en: "Billing"})}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild className="text-destructive">
                        <Link href="/login">
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>{t({fr: "Se déconnecter", en: "Log Out"})}</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-transparent flex-1">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
