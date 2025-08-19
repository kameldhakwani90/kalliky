'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';
import { Plus, X } from 'lucide-react';

const businessCards = [
  {
    id: 'fastfood',
    title: 'Fast Food',
    titleEn: 'Fast Food',
    subtitle: 'Comment OrderSpot révolutionne',
    subtitleEn: 'How OrderSpot revolutionizes',
    description: 'votre service de restauration rapide',
    descriptionEn: 'your fast food service',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=1200&fit=crop&q=90',
    modalTitle: 'Prise de commande intelligente',
    modalTitleEn: 'Smart Order Taking',
    modalDescription: 'Vos clients appellent et parlent naturellement à votre assistant IA. Plus besoin de répéter, plus d\'attente. L\'IA comprend parfaitement les commandes, propose des accompagnements et confirme chaque détail. Vos clients reçoivent un SMS avec le résumé et peuvent payer directement par lien sécurisé.',
    modalDescriptionEn: 'Your customers call and speak naturally to your AI assistant. No more repeating, no more waiting. AI perfectly understands orders, suggests accompaniments and confirms every detail. Your customers receive an SMS with the summary and can pay directly via secure link.',
    modalImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop&q=90'
  },
  {
    id: 'beauty',
    title: 'Salon de Beauté',
    titleEn: 'Beauty Salon',
    subtitle: 'Augmentez votre panier avec',
    subtitleEn: 'Increase your basket with',
    description: 'vente additionnelle intelligente',
    descriptionEn: 'smart upselling',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1200&fit=crop&q=90',
    modalTitle: 'Vente additionnelle naturelle',
    modalTitleEn: 'Natural Upselling',
    modalDescription: 'Pendant la prise de rendez-vous, votre IA propose naturellement des soins complémentaires adaptés au profil du client. Plus de vente forcée, juste des suggestions pertinentes qui valorisent l\'expérience client. L\'IA se souvient des préférences et adapte ses propositions à chaque appel.',
    modalDescriptionEn: 'During appointment booking, your AI naturally suggests complementary treatments adapted to the client\'s profile. No more forced selling, just relevant suggestions that enhance the customer experience. AI remembers preferences and adapts its suggestions to each call.',
    modalImage: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=400&fit=crop&q=90'
  },
  {
    id: 'realestate',
    title: 'Agence Immobilier',
    titleEn: 'Real Estate Agency',
    subtitle: 'Plus de stress, plus de perte',
    subtitleEn: 'No more stress, no more waste',
    description: 'de temps avec vos prospects',
    descriptionEn: 'of time with your prospects',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&h=1200&fit=crop&q=90',
    modalTitle: 'Qualification intelligente des prospects',
    modalTitleEn: 'Smart Prospect Qualification',
    modalDescription: 'Votre IA pose les bonnes questions pour qualifier sérieusement chaque prospect. Budget, critères, urgence, financement - tout est évalué professionnellement. Les prospects qualifiés sont automatiquement ajoutés à votre agenda avec toutes les informations nécessaires. Vous ne perdez plus de temps avec des visites non qualifiées.',
    modalDescriptionEn: 'Your AI asks the right questions to seriously qualify each prospect. Budget, criteria, urgency, financing - everything is evaluated professionally. Qualified prospects are automatically added to your calendar with all necessary information. You no longer waste time with unqualified visits.',
    modalImage: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&h=400&fit=crop&q=90'
  },
  {
    id: 'professional',
    title: 'Tous Professionnels',
    titleEn: 'All Professionals',
    subtitle: 'Qui perd 2h par jour au téléphone?',
    subtitleEn: 'Who loses 2h per day on the phone?',
    description: 'Votre assistant virtuel professionnel',
    descriptionEn: 'Your professional virtual assistant',
    image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=1200&fit=crop&q=90',
    modalTitle: 'Assistant professionnel 24h/24',
    modalTitleEn: '24/7 Professional Assistant',
    modalDescription: 'Plus jamais d\'appels manqués ou de clients frustrés. Votre IA répond avec le bon ton, les bonnes informations et prend les rendez-vous directement dans votre agenda. Elle filtre les appels importants, prend les messages détaillés et vous libère pour vous concentrer sur votre expertise.',
    modalDescriptionEn: 'Never miss calls or frustrated customers again. Your AI responds with the right tone, the right information and takes appointments directly in your calendar. It filters important calls, takes detailed messages and frees you to focus on your expertise.',
    modalImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop&q=90'
  },
  {
    id: 'enterprise',
    title: 'Entreprises Pro+',
    titleEn: 'Enterprise Pro+',
    subtitle: 'Automatisation complète',
    subtitleEn: 'Complete Automation',
    description: 'connectée à vos systèmes existants',
    descriptionEn: 'connected to your existing systems',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1200&fit=crop&q=90',
    modalTitle: 'Intégration ERP et automatisation',
    modalTitleEn: 'ERP Integration and Automation',
    modalDescription: 'Votre IA se connecte directement à votre ERP, CRM et tous vos outils existants. Les commandes sont automatiquement créées, les stocks mis à jour, les factures générées. Tableau de bord temps réel pour plusieurs sites, API webhooks pour vos développements custom, et account manager dédié pour un accompagnement personnalisé.',
    modalDescriptionEn: 'Your AI connects directly to your ERP, CRM and all existing tools. Orders are automatically created, stock updated, invoices generated. Real-time dashboard for multiple sites, API webhooks for your custom developments, and dedicated account manager for personalized support.',
    modalImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=90'
  }
];

export function InteractiveExamples() {
  const { language } = useLanguage();
  const [selectedCard, setSelectedCard] = useState(null);

  const openModal = (card) => {
    setSelectedCard(card);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            {language === 'fr' ? 'Découvrez OrderSpot.pro' : 'Discover OrderSpot.pro'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'fr' 
              ? 'L\'assistant IA qui révolutionne votre business selon votre secteur d\'activité'
              : 'The AI assistant that revolutionizes your business based on your industry'
            }
          </p>
        </div>

        {/* Vertical Cards Grid - Apple iPhone Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-8xl mx-auto">
          {businessCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative cursor-pointer"
              onClick={() => openModal(card)}
            >
              {/* Card - Increased height like Apple */}
              <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-xl">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img 
                    src={card.image}
                    alt={language === 'fr' ? card.title : card.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold">
                      {language === 'fr' ? card.title : card.titleEn}
                    </h3>
                    <p className="text-base font-medium text-white/90 leading-relaxed">
                      {language === 'fr' ? card.subtitle : card.subtitleEn}
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {language === 'fr' ? card.description : card.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Plus Button */}
                <div className="absolute top-6 right-6">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all duration-200">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal with Blur Background */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
            
            {/* Modal Content - Simple Apple Style */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-8 right-8 w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>

              {/* Modal Content - Title, Description, Image */}
              <div className="p-12">
                <div className="text-center mb-12">
                  <h2 className="text-sm font-medium text-gray-500 mb-4 tracking-wide uppercase">
                    OrderSpot Intelligence
                  </h2>
                  <h3 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
                    {language === 'fr' ? selectedCard.modalTitle : selectedCard.modalTitleEn}
                  </h3>
                </div>
                
                {/* Description */}
                <div className="max-w-3xl mx-auto mb-12">
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {language === 'fr' ? selectedCard.modalDescription : selectedCard.modalDescriptionEn}
                  </p>
                </div>

                {/* Image */}
                <div className="max-w-2xl mx-auto">
                  <div className="relative aspect-[3/2] rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                      src={selectedCard.modalImage}
                      alt={language === 'fr' ? selectedCard.modalTitle : selectedCard.modalTitleEn}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}