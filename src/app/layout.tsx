import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/providers/client-providers';

export const metadata: Metadata = {
  title: 'OrderSpot.pro - Assistant IA pour Restaurants | Commandes Téléphoniques Automatiques',
  description: "L'IA qui prend vos commandes téléphoniques 24h/24, augmente votre panier moyen de 25% et coûte 3x moins cher qu'Uber Eats. 15 jours gratuits.",
  keywords: 'restaurant IA, commande téléphonique, orderspot, assistant vocal restaurant, uber eats alternative, ia restaurant',
  openGraph: {
    title: 'OrderSpot.pro - Assistant IA pour Restaurants',
    description: 'Transformez chaque appel en commande avec notre IA. 25% panier moyen en plus, 0 appel raté, 24h/24.',
    url: 'https://orderspot.pro',
    siteName: 'OrderSpot.pro',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: 'https://orderspot.pro',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
