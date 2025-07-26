
"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building,
  DollarSign,
  LayoutDashboard,
  Settings,
  Users,
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
                isActive // Assuming dashboard is the default active page
                tooltip="Tableau de bord"
              >
                <Link href="/admin/dashboard">
                  <LayoutDashboard />
                  <span>Tableau de bord</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Restaurateurs">
                <Link href="#">
                  <Users />
                  <span>Restaurateurs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Facturation">
                <Link href="#">
                  <DollarSign />
                  <span>Facturation</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Paramètres">
                <Link href="/admin/settings">
                  <Settings />
                  <span>Paramètres</span>
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
            <Button variant="ghost" size="icon" className="text-sidebar-foreground/70" asChild>
                <Link href="/"><Settings /></Link>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
