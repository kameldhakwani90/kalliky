'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { Navigation } from '@/components/landing/Navigation';
import { FooterSection } from '@/components/landing/FooterSection';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation d'envoi (à remplacer par vraie API)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="container mx-auto px-6 py-32 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Message envoyé !</h1>
            <p className="text-gray-400 mb-8">
              Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
            </p>
            <Link href="/">
              <Button className="bg-white text-black hover:bg-gray-100">
                Retour à l'accueil
              </Button>
            </Link>
          </motion.div>
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="container mx-auto px-6 py-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Contactez-nous
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Une question ? Un projet ? Notre équipe d'experts est là pour vous accompagner 
              dans votre transformation digitale.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Informations de contact */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold mb-8">Parlons de votre projet</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Email</h3>
                    <p className="text-gray-400">contact@orderspot.pro</p>
                    <p className="text-gray-400">support@orderspot.pro</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Téléphone</h3>
                    <p className="text-gray-400">+33 (0)1 XX XX XX XX</p>
                    <p className="text-sm text-gray-500">Lun-Ven : 9h-18h</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Adresse</h3>
                    <p className="text-gray-400">
                      [Adresse complète]<br />
                      Paris, France
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
                <h3 className="font-semibold text-white mb-3">Réponse rapide garantie</h3>
                <p className="text-sm text-gray-400">
                  Nous nous engageons à répondre à toutes les demandes sous 4h ouvrées. 
                  Pour les urgences, contactez-nous directement par téléphone.
                </p>
              </div>
            </motion.div>

            {/* Formulaire de contact */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">Nom complet *</Label>
                      <Input
                        id="name"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="Votre nom"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="nom@exemple.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="+33 1 XX XX XX XX"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-300">Sujet *</Label>
                      <Input
                        id="subject"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        placeholder="Objet de votre demande"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-300">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      rows={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
                      placeholder="Décrivez-nous votre projet, vos besoins ou vos questions..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-white text-black hover:bg-gray-100 font-semibold h-12 rounded-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <FooterSection />
    </div>
  );
}