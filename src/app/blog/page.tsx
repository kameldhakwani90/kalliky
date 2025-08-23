'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, ArrowRight, Clock } from 'lucide-react';

const blogPosts = [
  {
    id: '1',
    title: 'L\'Intelligence Artificielle Transforme la Prise de Commandes en Restauration',
    excerpt: 'Découvrez comment l\'intelligence artificielle révolutionne les prises de commandes téléphoniques en restauration. Avantages, défis et conseils pratiques pour digitaliser votre restaurant.',
    author: 'Équipe Editorial',
    date: '23 août 2025',
    readTime: '8 min',
    slug: 'ia-restauration-revolution-commandes',
    category: 'Innovation',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop&q=90'
  }
];

export default function BlogPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Blog OrderSpot.pro
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les dernières innovations en IA, conseils pour votre business 
              et actualités du secteur de la restauration digitale.
            </p>
          </motion.div>

          {/* Articles de blog */}
          <div className="space-y-12">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                variants={itemVariants}
                className="group"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                    {/* Image */}
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-64 object-cover"
                    />
                    
                    <div className="p-8">
                      {/* Catégorie */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                        {post.category}
                      </div>
                      
                      {/* Titre */}
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>
                      
                      {/* Extrait */}
                      <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        {post.excerpt}
                      </p>
                      
                      {/* Métadonnées */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {post.author}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {post.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {post.readTime} de lecture
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-blue-600 group-hover:gap-3 transition-all">
                          <span className="font-medium">Lire l'article</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>

          {/* Message pour plus d'articles */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-200"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Plus d'articles bientôt !</h3>
            <p className="text-gray-600 mb-6">
              Nous publions régulièrement du contenu sur les innovations IA, 
              les meilleures pratiques et les tendances du secteur.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/contact">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                  Suggérer un sujet
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}