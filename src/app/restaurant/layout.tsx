
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  Phone,
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
  useSidebar
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
import { authService } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "sonner"
import { ThemeToggle } from "@/components/ui/theme-toggle"

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
      type: 'call',
      title: 'Nouvel appel entrant',
      description: 'Client souhaite réserver une table pour 4 personnes',
      time: 'il y a 1 heure',
      link: '/restaurant/activity'
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

function RestaurantLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [hasUnreadNotifications, setHasUnreadNotifications] = React.useState(true);
  const { setOpenMobile } = useSidebar();

  const handleLogout = () => {
    authService.logout();
    toast({
      title: t({fr: "Déconnexion réussie", en: "Logout successful"}),
      description: t({fr: "À bientôt !", en: "See you soon!"}),
    });
    router.push("/login");
  };

  const menuItems = [
    { href: "/restaurant/dashboard", label: {fr: "Aperçu", en: "Overview"}, icon: Home },
    { href: "/restaurant/activity", label: {fr: "Activité", en: "Activity"}, icon: LayoutGrid },
    { href: "/restaurant/clients", label: {fr: "Clients", en: "Customers"}, icon: User },
    { href: "/restaurant/stores", label: {fr: "Gestion", en: "Management"}, icon: Settings },
  ];

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="glass-effect border-r border-gray-200/50 shadow-apple">
        <SidebarHeader className="p-4">
           <KallikyLogo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={pathname.startsWith(item.href)}
                  tooltip={t(item.label)}
                  className="data-[active=true]:bg-black data-[active=true]:text-white font-medium hover:bg-gray-100 transition-smooth rounded-xl mx-1 my-1"
                >
                  <Link href={item.href} onClick={() => setOpenMobile(false)}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{t(item.label)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b border-gray-200/50 glass-effect sticky top-0 z-40 shadow-apple">
            <SidebarTrigger className="md:hidden rounded-xl" />
            <div className="flex-1 px-4">
                {/* Optional Header Content */}
            </div>
            <ThemeToggle />
             <DropdownMenu onOpenChange={(open) => {if(open) setHasUnreadNotifications(false)}}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 rounded-xl transition-smooth">
                        <Bell className="h-5 w-5" />
                         {hasUnreadNotifications && <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>}
                        <span className="sr-only">Notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 glass-effect border border-gray-200/50 shadow-apple-lg rounded-2xl" align="end">
                    <DropdownMenuLabel>{t({fr: "Notifications", en: "Notifications"})}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.slice(0, 3).map((notif) => (
                         <DropdownMenuItem key={notif.id} asChild>
                          <Link href={notif.link} className="flex items-start gap-3 p-3 cursor-pointer">
                            <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback className={
                                  notif.type === 'order' ? 'bg-blue-100' : 
                                  notif.type === 'call' ? 'bg-green-100' : 'bg-red-100'
                                }>
                                    {notif.type === 'order' ? <Receipt className="h-4 w-4 text-blue-600"/> : 
                                     notif.type === 'call' ? <Phone className="h-4 w-4 text-green-600"/> :
                                     <Flag className="h-4 w-4 text-red-600"/>}
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
                                            <AvatarFallback className={
                                              notif.type === 'order' ? 'bg-blue-100' : 
                                              notif.type === 'call' ? 'bg-green-100' : 'bg-red-100'
                                            }>
                                                {notif.type === 'order' ? <Receipt className="h-4 w-4 text-blue-600"/> : 
                                                 notif.type === 'call' ? <Phone className="h-4 w-4 text-green-600"/> :
                                                 <Flag className="h-4 w-4 text-red-600"/>}
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
                    <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-gray-200/50 hover:ring-blue-400/50 transition-all duration-200">
                        <AvatarImage src="https://placehold.co/100x100" data-ai-hint="restaurant owner" />
                        <AvatarFallback>LP</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl" align="end">
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
                     <DropdownMenuItem 
                        className="text-destructive cursor-pointer" 
                        onClick={handleLogout}
                     >
                        <XCircle className="mr-2 h-4 w-4" />
                        <span>{t({fr: "Se déconnecter", en: "Log Out"})}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 flex-1 min-h-screen">
            {children}
        </main>
      </SidebarInset>
    </>
  );
}


export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <RestaurantLayoutContent>{children}</RestaurantLayoutContent>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}
