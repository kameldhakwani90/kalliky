'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setStep('code');
        toast.success('Code envoyé ! Vérifiez votre email.');
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.code.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres');
      return;
    }

    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          code: formData.code,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Mot de passe mis à jour !');
        router.push('/login?message=password-reset-success');
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border-white/20 rounded-3xl border shadow-2xl">
          <div className="space-y-4 p-8 pb-6">
            <div className="flex items-center justify-between">
              <Link href="/login">
                <button className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              </Link>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
                {step === 'email' && <Mail className="h-8 w-8 text-white" />}
                {step === 'code' && <Shield className="h-8 w-8 text-white" />}
                {step === 'password' && <Key className="h-8 w-8 text-white" />}
              </div>
              
              <h1 className="text-2xl font-bold text-white">
                {step === 'email' && 'Mot de passe oublié'}
                {step === 'code' && 'Vérification'}
                {step === 'password' && 'Nouveau mot de passe'}
              </h1>
              
              <p className="text-white/70 mt-2">
                {step === 'email' && 'Entrez votre email pour recevoir un code de réinitialisation'}
                {step === 'code' && 'Entrez le code à 6 chiffres envoyé par email'}
                {step === 'password' && 'Choisissez votre nouveau mot de passe'}
              </p>
            </div>
          </div>

          <div className="space-y-6 p-8">
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-white font-medium mb-2 block">Adresse email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="votre@email.com"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le code'}
                </button>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">
                      Un code à 6 chiffres a été envoyé à <strong>{formData.email}</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-white font-medium mb-2 block">Code de vérification</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-white/70 mt-1">Le code expire dans 15 minutes</p>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-3 rounded-xl transition-colors"
                >
                  Vérifier le code
                </button>
                
                <button 
                  type="button"
                  onClick={() => handleEmailSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10 font-medium py-3 rounded-xl transition-colors mt-3"
                >
                  Renvoyer l'email
                </button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">
                      Code vérifié ! Vous pouvez maintenant changer votre mot de passe.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-white font-medium mb-2 block">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-white font-medium mb-2 block">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Retapez le mot de passe"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            )}

            <div className="text-center pt-4">
              <p className="text-sm text-white/70">
                Vous vous souvenez de votre mot de passe ?{' '}
                <Link href="/login" className="text-white hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}