
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Building,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  BarChart3,
  CreditCard,
  Activity,
  Phone,
  Briefcase
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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"
import { authService } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const handleLogout = () => {
    authService.logout()
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    })
    router.push("/login")
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="px-2 py-1">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/dashboard'}
                tooltip="Métriques & Consommation"
              >
                <Link href="/admin/dashboard">
                  <BarChart3 />
                  <span>Métriques</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/admin/clients'}
                tooltip="Gestion des clients"
              >
                <Link href="/admin/clients">
                  <Users />
                  <span>Clients</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/admin/telnyx-monitoring'}
                tooltip="Monitoring Telnyx & Remboursements"
              >
                <Link href="/admin/telnyx-monitoring">
                  <Phone />
                  <span>Telnyx & Refunds</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/admin/subscriptions'}
                tooltip="Gestion des Abonnements"
              >
                <Link href="/admin/subscriptions">
                  <CreditCard />
                  <span>Abonnements</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/admin/business-types'}
                tooltip="Configuration Types Métiers"
              >
                <Link href="/admin/business-types">
                  <Briefcase />
                  <span>Types Métiers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2">
            <Avatar>
              <AvatarImage src="https://placehold.co/100x100" data-ai-hint="admin user" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-semibold text-sm">Admin</p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                admin@kalliky.ai
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-sidebar-foreground/70 hover:text-red-500" 
              onClick={handleLogout}
              title="Se déconnecter"
            >
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
