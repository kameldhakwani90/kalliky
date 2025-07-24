
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
  BadgeHelp,
  Bell
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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function KallikyLogo() {
    return (
        <div className="flex items-center gap-2">
             <div className="p-2 bg-primary rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M2 7L12 12M22 7L12 12M12 22V12M17 4.5L7 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-lg">Le Petit Bistro</span>
            </div>
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
    { href: "/restaurant/dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
    { href: "/restaurant/menu", label: "Menu", icon: CookingPot },
    { href: "/restaurant/billing", label: "Facturation", icon: CreditCard },
    { href: "/admin/dashboard", label: "Clients", icon: Users },
  ];
  
  const helpItems = [
      { href: "#", label: "Aide", icon: BadgeHelp },
      { href: "#", label: "Paramètres", icon: Settings },
  ]

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader>
           <KallikyLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
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
          </SidebarMenu>
          
           <SidebarMenu className="mt-auto">
             {helpItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
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
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
             <div className="flex items-center gap-3 p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://placehold.co/100x100" data-ai-hint="restaurant owner" />
                  <AvatarFallback>LP</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-semibold text-sm">Louis Perrin</p>
                  <p className="truncate text-xs text-sidebar-foreground/70">
                    louis.perrin@bistro.fr
                  </p>
                </div>
              </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                {/* Optional Header Content */}
            </div>
             <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
            </Button>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
