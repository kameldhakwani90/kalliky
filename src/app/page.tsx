import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  ChefHat,
  LayoutDashboard,
  BarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/header';

export default function Home() {
  const features = [
    {
      icon: <Bot className="h-10 w-10 text-primary" />,
      title: 'Synchronisation de Menu par IA',
      description: 'Importez votre menu via un fichier Excel et notre IA le structure et le met à jour automatiquement.',
      link: '#',
    },
    {
      icon: <LayoutDashboard className="h-10 w-10 text-primary" />,
      title: 'Tableaux de Bord Intuitifs',
      description: 'Gérez votre restaurant en temps réel avec des dashboards pour les commandes, la cuisine (KDS) et l\'administration.',
      link: '#',
    },
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: 'Analyses et Rapports',
      description: 'Suivez vos revenus, vos commandes et vos commissions avec des métriques claires et des rapports détaillés.',
      link: '#',
    },
    {
      icon: <ChefHat className="h-10 w-10 text-primary" />,
      title: 'Conçu pour les Restaurateurs',
      description: 'De l\'inscription facile à la gestion quotidienne, tout est pensé pour simplifier la vie des professionnels.',
      link: '#',
    },
  ];

  const testimonials = [
    {
      name: 'Chef Antoine',
      title: 'Propriétaire, Le Gourmet Parisien',
      avatar: 'https://placehold.co/100x100.png',
      hint: 'man chef',
      text: "Kalliky.ai a transformé notre gestion des commandes. L'IA est bluffante et le KDS est un outil indispensable en cuisine.",
    },
    {
      name: 'Juliette Dubois',
      title: 'Manager, Pizzeria Bella',
      avatar: 'https://placehold.co/100x100.png',
      hint: 'woman manager',
      text: "La prise en main a été incroyablement simple. Le tableau de bord me donne une vision claire de mon activité en un clin d'œil.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 tracking-tight">
              La Révolution de la Commande par IA pour votre Restaurant
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Kalliky.ai automatise la prise de commande vocale, synchronise vos menus et optimise votre service pour une efficacité maximale.
            </p>
            <Button asChild size="lg">
              <Link href="/signup">
                Démarrer gratuitement <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="features" className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">
                Une plateforme tout-en-un
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Découvrez les outils puissants que Kalliky.ai met à votre disposition.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-background transition-shadow duration-300">
                  <CardHeader className="items-center text-center">
                    <div className="p-3 rounded-full bg-primary/10 mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                  Comment ça marche ?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Lancez-vous sur Kalliky.ai en trois étapes simples et rapides.
                </p>
                <ol className="space-y-6">
                  <li className="flex items-start">
                    <div className="mr-4 flex-shrink-0 bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="text-xl font-semibold">Créez votre compte</h3>
                      <p className="text-muted-foreground">Inscrivez-vous, choisissez votre abonnement et configurez les informations de base de votre restaurant.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-4 flex-shrink-0 bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="text-xl font-semibold">Importez votre menu</h3>
                      <p className="text-muted-foreground">Téléchargez votre menu au format Excel. Notre IA s'occupe du reste pour le rendre disponible en ligne.</p>
                    </div>
                  </li>
                   <li className="flex items-start">
                    <div className="mr-4 flex-shrink-0 bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h3 className="text-xl font-semibold">Commencez à recevoir des commandes</h3>
                      <p className="text-muted-foreground">Activez le système et recevez vos premières commandes via l'IA sur vos tableaux de bord dédiés.</p>
                    </div>
                  </li>
                </ol>
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="Interface Kalliky.ai"
                  width={600}
                  height={400}
                  data-ai-hint="dashboard analytics"
                  className="rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">
                Ils nous font confiance
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ce que les restaurateurs pensent de Kalliky.ai.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-background">
                  <CardContent className="pt-6">
                    <div className="flex items-start">
                      <Avatar className="mr-4">
                        <AvatarImage src={testimonial.avatar} data-ai-hint={testimonial.hint} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <blockquote className="italic text-foreground mb-4">
                          "{testimonial.text}"
                        </blockquote>
                        <p className="font-bold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
              Prêt à transformer votre restaurant ?
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto mb-8">
              Rejoignez des dizaines de restaurateurs qui optimisent déjà leur service avec Kalliky.ai.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">
                Essayer maintenant <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kalliky.ai. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
