
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

// Sidebar supprimé - navigation par icône dashboard dans header
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

// Logo déplacé vers la page d'accueil

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

  const handleLogout = () => {
    authService.logout();
    toast({
      title: t({fr: "Déconnexion réussie", en: "Logout successful"}),
      description: t({fr: "À bientôt !", en: "See you soon!"}),
    });
    router.push("/login");
  };

  // MenuItems supprimés - navigation par cartes sur la page d'accueil

  // Layout sans sidebar pour toutes les pages + icône dashboard dans header
  return (
    <>
      <div className="min-h-screen dark">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
            {/* Icône Dashboard pour retourner à la page d'accueil */}
            <div className="px-4">
              <Link href="/restaurant/home" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-10 w-10 rounded-2xl text-white hover:bg-white/20 group">
                <Home className="h-5 w-5 transition-colors" />
                <span className="sr-only">Retour à l'accueil</span>
              </Link>
            </div>
            <div className="flex-1 px-4">
                {/* Optional Header Content */}
            </div>
            <div className="hidden">
              <ThemeToggle />
            </div>
             <DropdownMenu onOpenChange={(open) => {if(open) setHasUnreadNotifications(false)}}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-white/20 rounded-2xl transition-all text-white">
                        <Bell className="h-5 w-5" />
                         {hasUnreadNotifications && <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                        </span>}
                        <span className="sr-only">Notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl" align="end">
                    <DropdownMenuLabel className="text-white">{t({fr: "Notifications", en: "Notifications"})}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/20" />
                    {notifications.slice(0, 3).map((notif) => (
                         <DropdownMenuItem key={notif.id} asChild className="hover:bg-white/10">
                          <Link href={notif.link} className="flex items-start gap-3 p-3 cursor-pointer">
                            <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback className="bg-gray-500/20 border border-gray-400/30">
                                    {notif.type === 'order' ? <Receipt className="h-4 w-4 text-gray-400"/> : 
                                     notif.type === 'call' ? <Phone className="h-4 w-4 text-gray-400"/> :
                                     <Flag className="h-4 w-4 text-gray-400"/>}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm text-white">{notif.title}</p>
                                <p className="text-xs text-gray-400">{notif.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-white/20" />
                    <Dialog>
                        <DialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="justify-center hover:bg-white/10 text-white">
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
                                            <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                                                {notif.type === 'order' ? <Receipt className="h-4 w-4 text-gray-600 dark:text-gray-400"/> : 
                                                 notif.type === 'call' ? <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400"/> :
                                                 <Flag className="h-4 w-4 text-gray-600 dark:text-gray-400"/>}
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
                    <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-white/30 hover:ring-white/50 transition-all duration-200">
                        <AvatarImage src="https://placehold.co/100x100" data-ai-hint="restaurant owner" />
                        <AvatarFallback className="bg-white/20 text-white border border-white/30">LP</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl" align="end">
                    <DropdownMenuLabel className="text-white">{t({fr: "Mon Compte", en: "My Account"})}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/20" />
                     <DropdownMenuItem asChild className="hover:bg-white/10">
                        <Link href="/restaurant/profile" className="text-white">
                            <User className="mr-2 h-4 w-4" />
                            <span>{t({fr: "Profil", en: "Profile"})}</span>
                        </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild className="hover:bg-white/10">
                        <Link href="/restaurant/billing" className="text-white">
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>{t({fr: "Facturation", en: "Billing"})}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/20" />
                     <DropdownMenuItem 
                        className="text-gray-400 cursor-pointer hover:bg-gray-500/20 hover:text-gray-300" 
                        onClick={handleLogout}
                     >
                        <XCircle className="mr-2 h-4 w-4" />
                        <span>{t({fr: "Se déconnecter", en: "Log Out"})}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <main className="flex-1 min-h-screen">
            {children}
        </main>
      </div>
    </>
  );
}


export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <RestaurantLayoutContent>{children}</RestaurantLayoutContent>
      <Toaster richColors position="top-right" />
    </>
  )
}
