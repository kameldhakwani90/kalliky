'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  ChefHat, 
  Scissors, 
  MapPin, 
  Home, 
  BookOpen, 
  ArrowLeft,
  ChevronRight,
  FileText,
  Sparkles,
  Settings,
  Phone,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  href: string;
  icon?: any;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Vue d\'ensemble',
    href: '/help',
    icon: BookOpen
  },
  {
    title: 'Restauration',
    href: '/help/food',
    icon: ChefHat,
    children: [
      { title: 'Configuration initiale', href: '/help/food/setup' },
      { title: 'Gestion du menu', href: '/help/food/menu' },
      { title: 'Prises de commandes', href: '/help/food/orders' },
      { title: 'Livraisons', href: '/help/food/delivery' },
      { title: 'Analytics restaurant', href: '/help/food/analytics' }
    ]
  },
  {
    title: 'Beauté & Bien-être',
    href: '/help/beaute',
    icon: Scissors,
    children: [
      { title: 'Gestion des rendez-vous', href: '/help/beaute/appointments' },
      { title: 'Services et tarifs', href: '/help/beaute/services' },
      { title: 'Gestion clientèle', href: '/help/beaute/clients' },
      { title: 'Planification équipe', href: '/help/beaute/staff' }
    ]
  },
  {
    title: 'Location & Services',
    href: '/help/location',
    icon: MapPin,
    children: [
      { title: 'Réservations', href: '/help/location/bookings' },
      { title: 'Gestion du matériel', href: '/help/location/equipment' },
      { title: 'Calendrier partagé', href: '/help/location/calendar' },
      { title: 'Facturation', href: '/help/location/billing' }
    ]
  },
  {
    title: 'Immobilier & Hébergement',
    href: '/help/realstate',
    icon: Home,
    children: [
      { title: 'Configuration Airbnb', href: '/help/realstate/airbnb' },
      { title: 'Check-in automatique', href: '/help/realstate/checkin' },
      { title: 'Conciergerie', href: '/help/realstate/concierge' },
      { title: 'Multi-propriétés', href: '/help/realstate/multi' }
    ]
  },
  {
    title: 'Fonctionnalités générales',
    href: '/help/general',
    icon: Settings,
    children: [
      { title: 'Configuration IA', href: '/help/general/ai' },
      { title: 'Téléphonie', href: '/help/general/telephony' },
      { title: 'Intégrations', href: '/help/general/integrations' },
      { title: 'Sécurité & RGPD', href: '/help/general/security' }
    ]
  },
  {
    title: 'Facturation & Plans',
    href: '/help/billing',
    icon: CreditCard,
    children: [
      { title: 'Comprendre les plans', href: '/help/billing/plans' },
      { title: 'Gestion des paiements', href: '/help/billing/payments' },
      { title: 'Factures et commissions', href: '/help/billing/invoices' },
      { title: 'Résiliation', href: '/help/billing/cancellation' }
    ]
  },
  {
    title: 'Support & Contact',
    href: '/help/support',
    icon: Phone
  }
];

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/help') {
      return pathname === '/help';
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: MenuItem) => {
    if (!item.children) return false;
    return item.children.some(child => pathname.startsWith(child.href));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Link href="/help" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">OrderSpot.pro Docs</span>
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost" 
              size="sm"
              className="md:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Sidebar - Desktop */}
          <div className="hidden md:block w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 min-h-[calc(100vh-80px)] sticky top-0">
            <nav className="p-6">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive(item.href) || hasActiveChild(item)
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                          : "text-gray-300 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                      <span className="font-medium">{item.title}</span>
                      {item.children && (
                        <ChevronRight className={cn(
                          "h-4 w-4 ml-auto transition-transform",
                          hasActiveChild(item) ? "rotate-90" : ""
                        )} />
                      )}
                    </Link>
                    
                    {/* Submenu */}
                    {item.children && hasActiveChild(item) && (
                      <div className="mt-1 ml-8 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "block px-4 py-2 text-sm rounded-lg transition-colors",
                              pathname === child.href
                                ? "text-blue-300 bg-blue-500/10"
                                : "text-gray-400 hover:text-white"
                            )}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          </div>

          {/* Mobile Sidebar */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-xl">
              <div className="w-80 bg-gray-900 h-full border-r border-white/10">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xl font-bold text-white">Documentation</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                  
                  <nav className="space-y-1">
                    {menuItems.map((item) => (
                      <div key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                            isActive(item.href) || hasActiveChild(item)
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                              : "text-gray-300 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                          <span className="font-medium">{item.title}</span>
                        </Link>
                        
                        {item.children && hasActiveChild(item) && (
                          <div className="mt-1 ml-8 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  "block px-4 py-2 text-sm rounded-lg transition-colors",
                                  pathname === child.href
                                    ? "text-blue-300 bg-blue-500/10"
                                    : "text-gray-400 hover:text-white"
                                )}
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-h-[calc(100vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}