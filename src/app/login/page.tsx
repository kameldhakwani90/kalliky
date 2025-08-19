'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${response.user.firstName || response.user.email}`,
      });

      // Rediriger selon le rôle
      const redirectPath = authService.getRedirectPath(response.user);
      router.push(redirectPath);

    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="container max-w-md mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="min-h-screen flex flex-col justify-center"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
            
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Bot className="h-7 w-7 text-black" />
              </div>
              <span className="text-3xl font-bold">OrderSpot</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bon Retour
            </h1>
            
            <p className="text-lg text-gray-400">
              Connectez-vous à votre espace
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.div variants={itemVariants}>
            <div className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/10 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3 text-red-400">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">{error}</span>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nom@exemple.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white text-black hover:bg-gray-100 font-semibold h-12 rounded-2xl" 
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>

                <p className="text-sm text-gray-400 text-center">
                  La redirection se fera automatiquement selon vos droits d'accès.
                </p>
              </form>
            </div>
            
            <p className="text-center text-gray-400 mt-8">
              Pas encore de compte ?{' '}
              <Link href="/signup" className="text-white underline hover:no-underline font-medium">
                Inscrivez-vous
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}