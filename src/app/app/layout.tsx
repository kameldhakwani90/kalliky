
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
      link: '/app/clients/cust-1'
    },
    {
      id: 'notif-2',
      type: 'call',
      title: 'Nouvel appel entrant',
      description: 'Client souhaite réserver une table pour 4 personnes',
      time: 'il y a 1 heure',
      link: '/app/activity'
    },
     {
      id: 'notif-3',
      type: 'order',
      title: 'Nouvelle commande #1024',
      description: 'Bob Dupont - 1 article - 18,00€',
      time: 'il y a 3 heures',
      link: '/app/clients/cust-2'
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
              <Link href="/app/home" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-10 w-10 rounded-2xl text-white hover:bg-white/20 group">
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
             {/* Notifications - display only, no dropdown */}
             <Button variant="ghost" size="icon" className="relative text-white cursor-default opacity-60" disabled>
                 <Bell className="h-5 w-5" />
                 {hasUnreadNotifications && <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                 </span>}
                 <span className="sr-only">Notifications</span>
             </Button>
             
             {/* User Profile Dropdown */}
             <div className="pr-4">
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                     <Avatar className="h-9 w-9 ring-2 ring-white/30">
                       <AvatarImage src="https://placehold.co/100x100" data-ai-hint="restaurant owner" />
                       <AvatarFallback className="bg-white/20 text-white border border-white/30">LP</AvatarFallback>
                     </Avatar>
                   </Button>
                 </DropdownMenuTrigger>
               <DropdownMenuContent className="w-56" align="end" forceMount>
                 <DropdownMenuLabel className="font-normal">
                   <div className="flex flex-col space-y-1">
                     <p className="text-sm font-medium leading-none">Propriétaire</p>
                     <p className="text-xs leading-none text-muted-foreground">
                       medkamel.dhakwani@gmail.com
                     </p>
                   </div>
                 </DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                   <Link href="/app/profile" className="cursor-pointer">
                     <User className="mr-2 h-4 w-4" />
                     <span>Profil</span>
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <Link href="/app/billing" className="cursor-pointer">
                     <CreditCard className="mr-2 h-4 w-4" />
                     <span>Facturation</span>
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <Link href="/app/stores" className="cursor-pointer">
                     <Settings className="mr-2 h-4 w-4" />
                     <span>Paramètres</span>
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                   <XCircle className="mr-2 h-4 w-4" />
                   <span>Se déconnecter</span>
                 </DropdownMenuItem>
               </DropdownMenuContent>
               </DropdownMenu>
             </div>
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
