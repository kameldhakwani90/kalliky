

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  LayoutDashboard,
  Settings,
  CookingPot,
  Users,
  Bell,
  PlusCircle,
  Home,
  User,
  Store,
  Zap,
  XCircle,
  Flag,
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
  SidebarFooter,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

function KallikyLogo() {
    return (
      <div className="p-2">
        <Logo />
      </div>
    )
}

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/restaurant/dashboard", label: "Aperçu", icon: Home },
    { href: "/restaurant/menu", label: "Menu", icon: CookingPot },
    { href: "/restaurant/clients", label: "Clients", icon: User },
    { href: "/restaurant/reports", label: "Signalements", icon: Flag },
  ];
  
  const settingsItems = [
    { href: "/restaurant/stores", label: "Boutiques", icon: Store },
    { href: "/restaurant/users", label: "Utilisateurs", icon: Users },
    { href: "/restaurant/billing", label: "Facturation", icon: CreditCard },
  ];

  const isSettingsPathActive = settingsItems.some(item => pathname.startsWith(item.href));

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader>
           <KallikyLogo />
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2">
            <Button className="w-full justify-start" asChild>
                <Link href="#">
                    <PlusCircle />
                    <span>Créer une campagne</span>
                </Link>
            </Button>
          </div>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                  className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground font-semibold"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <Collapsible defaultOpen={isSettingsPathActive}>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            tooltip="Configuration"
                            className={cn(
                                "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground font-semibold",
                                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                             )}
                            isActive={isSettingsPathActive}
                        >
                            <Settings />
                            <span>Configuration</span>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent asChild>
                    <SidebarMenuSub>
                        {settingsItems.map((item) => (
                            <SidebarMenuSubItem key={item.label}>
                                <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)}>
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            {/* Footer can be used for other elements if needed */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                {/* Optional Header Content */}
            </div>
             <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar className="h-9 w-9 cursor-pointer">
                        <AvatarImage src="https://placehold.co/100x100" data-ai-hint="restaurant owner" />
                        <AvatarFallback>LP</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Intégrations</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem className="text-destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        <span>Se déconnecter</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-muted/30 flex-1">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
