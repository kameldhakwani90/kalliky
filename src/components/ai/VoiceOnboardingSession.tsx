'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Clock, 
  MessageCircle,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  SkipForward
} from 'lucide-react';
import { toast } from 'sonner';

interface VoiceQuestion {
  id: string;
  text: string;
  expectedDuration: number; // secondes
  followUpQuestions?: string[];
  analysis: {
    keywords: string[];
    category: string;
    importance: 'high' | 'medium' | 'low';
  };
}

interface SessionAnalysis {
  restaurantType: string;
  cuisine: string;
  targetCustomers: string[];
  specialties: string[];
  busyHours: string[];
  priceRange: string;
  atmosphere: string;
  strengths: string[];
  challenges: string[];
  aiRecommendations: string[];
  confidence: number;
}

interface VoiceOnboardingSessionProps {
  storeId?: string;
  onComplete: (analysis: SessionAnalysis) => void;
  onSkip: () => void;
  maxDuration?: number; // minutes
}

const VOICE_QUESTIONS: VoiceQuestion[] = [
  {
    id: 'intro',
    text: "Bonjour ! Je suis votre assistant IA. Pouvez-vous me décrire votre restaurant en quelques mots ? Quel type de cuisine proposez-vous ?",
    expectedDuration: 45,
    analysis: {
      keywords: ['restaurant', 'cuisine', 'type', 'spécialité'],
      category: 'basic_info',
      importance: 'high'
    }
  },
  {
    id: 'specialties',
    text: "Parfait ! Quels sont vos plats ou produits phares ? Qu'est-ce qui rend votre restaurant unique ?",
    expectedDuration: 40,
    followUpQuestions: [
      "Y a-t-il des plats que vous recommanderiez particulièrement ?",
      "Avez-vous des spécialités maison ?"
    ],
    analysis: {
      keywords: ['plats', 'spécialité', 'unique', 'phare', 'recommande'],
      category: 'products',
      importance: 'high'
    }
  },
  {
    id: 'customers',
    text: "Qui sont vos clients principaux ? Des familles, des professionnels, des étudiants ? À quels moments venez-vous le plus ?",
    expectedDuration: 35,
    analysis: {
      keywords: ['clients', 'familles', 'professionnels', 'étudiants', 'moments'],
      category: 'target_audience',
      importance: 'high'
    }
  },
  {
    id: 'pricing',
    text: "Dans quelle gamme de prix vous situez-vous ? Quel est le prix moyen d'un repas chez vous ?",
    expectedDuration: 25,
    analysis: {
      keywords: ['prix', 'gamme', 'moyen', 'repas', 'tarif'],
      category: 'pricing',
      importance: 'medium'
    }
  },
  {
    id: 'atmosphere',
    text: "Comment décririez-vous l'ambiance de votre restaurant ? Plutôt décontractée, familiale, raffinée ?",
    expectedDuration: 30,
    analysis: {
      keywords: ['ambiance', 'atmosphère', 'décontracté', 'familial', 'raffiné'],
      category: 'atmosphere',
      importance: 'medium'
    }
  },
  {
    id: 'challenges',
    text: "Pour finir, quels sont vos principaux défis ? Qu'aimeriez-vous améliorer dans votre service ?",
    expectedDuration: 35,
    analysis: {
      keywords: ['défis', 'améliorer', 'service', 'problème', 'objectif'],
      category: 'challenges',
      importance: 'high'
    }
  }
];

function VoiceOnboardingSession({ 
  storeId, 
  onComplete, 
  onSkip, 
  maxDuration = 4 
}: VoiceOnboardingSessionProps) {
  // États de la session
  const [isActive, setIsActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Réponses et analyse
  const [responses, setResponses] = useState<{ [questionId: string]: string }>({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Calculer le temps restant et le progrès
  const maxDurationMs = maxDuration * 60 * 1000;
  const remainingTime = Math.max(0, maxDurationMs - elapsedTime);
  const progress = (elapsedTime / maxDurationMs) * 100;
  const isTimeUp = remainingTime <= 0;

  // Questions
  const currentQuestion = VOICE_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === VOICE_QUESTIONS.length - 1;
  const totalQuestions = VOICE_QUESTIONS.length;

  useEffect(() => {
    // Initialiser la synthèse vocale
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);

  useEffect(() => {
    // Timer pour suivre le temps écoulé
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1000);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isPaused]);

  useEffect(() => {
    // Finir automatiquement si le temps est écoulé
    if (isTimeUp && isActive) {
      handleCompleteSession();
    }
  }, [isTimeUp, isActive]);

  const startSession = async () => {
    try {
      setIsActive(true);
      setSessionStartTime(new Date());
      setElapsedTime(0);
      setCurrentQuestionIndex(0);
      
      // Commencer par la première question
      await speakQuestion(VOICE_QUESTIONS[0]);
      
      toast.success('Session vocale démarrée');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Erreur lors du démarrage de la session');
    }
  };

  const pauseSession = () => {
    setIsPaused(true);
    stopRecording();
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const resumeSession = () => {
    setIsPaused(false);
    if (currentQuestion) {
      speakQuestion(currentQuestion);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsPaused(false);
    stopRecording();
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const speakQuestion = async (question: VoiceQuestion) => {
    if (!synthRef.current) return;

    // Annuler toute synthèse en cours
    synthRef.current.cancel();

    // Créer l'utterance
    const utterance = new SpeechSynthesisUtterance(question.text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Démarrer l'enregistrement après que l'IA ait fini de parler
    utterance.onend = () => {
      setTimeout(() => {
        if (isActive && !isPaused) {
          startRecording();
        }
      }, 500);
    };

    synthRef.current.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processRecording();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Arrêter automatiquement après le temps attendu + marge
      const expectedDuration = currentQuestion?.expectedDuration || 30;
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          stopRecording();
        }
      }, (expectedDuration + 10) * 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Erreur lors de l\'accès au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessing(true);

    try {
      // Créer le blob audio
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Simuler la transcription et l'analyse
      const transcription = await simulateTranscription(audioBlob);
      
      // Sauvegarder la réponse
      setResponses(prev => ({
        ...prev,
        [currentQuestion.id]: transcription
      }));

      setCurrentResponse(transcription);

      // Attendre un moment puis passer à la question suivante
      setTimeout(() => {
        nextQuestion();
      }, 2000);

    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Erreur lors du traitement de l\'audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateTranscription = async (audioBlob: Blob) => {
    // Simulation de transcription - en production, utiliser un service de transcription
    const mockResponses = {
      intro: "Nous avons un restaurant italien traditionnel, nous servons des pâtes fraîches et des pizzas artisanales depuis 15 ans.",
      specialties: "Nos spécialités sont les tagliatelles à la truffe et notre pizza margherita au four à bois. Nous faisons tout maison.",
      customers: "Nous avons beaucoup de familles le weekend et des couples en semaine. Les gens viennent surtout le soir entre 19h et 22h.",
      pricing: "Nos prix vont de 12€ pour les pâtes à 18€ pour les pizzas. Un repas complet coûte environ 25-30€ par personne.",
      atmosphere: "L'ambiance est chaleureuse et familiale, avec de la musique italienne en fond et une décoration traditionnelle.",
      challenges: "Notre principal défi est de gérer l'affluence du weekend et d'améliorer notre service de livraison."
    };

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1500));

    return mockResponses[currentQuestion.id as keyof typeof mockResponses] || "Réponse enregistrée.";
  };

  const nextQuestion = async () => {
    if (isLastQuestion) {
      await handleCompleteSession();
    } else {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentResponse('');
      
      // Petit délai puis poser la question suivante
      setTimeout(async () => {
        if (isActive && !isPaused) {
          await speakQuestion(VOICE_QUESTIONS[nextIndex]);
        }
      }, 1000);
    }
  };

  const skipQuestion = () => {
    if (isRecording) {
      stopRecording();
    }
    nextQuestion();
  };

  const handleCompleteSession = async () => {
    stopSession();
    setIsProcessing(true);

    try {
      // Analyser toutes les réponses
      const sessionAnalysis = await analyzeResponses(responses);
      setAnalysis(sessionAnalysis);
      
      // Sauvegarder l'analyse si storeId fourni
      if (storeId) {
        await saveSessionAnalysis(storeId, sessionAnalysis);
      }

      toast.success('Session complétée avec succès !');
      onComplete(sessionAnalysis);

    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Erreur lors de l\'analyse des réponses');
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeResponses = async (responses: { [key: string]: string }): Promise<SessionAnalysis> => {
    // Simulation d'analyse IA des réponses
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      restaurantType: "Restaurant Italien",
      cuisine: "Italienne traditionnelle",
      targetCustomers: ["Familles", "Couples", "Amateurs de cuisine italienne"],
      specialties: ["Tagliatelles à la truffe", "Pizza Margherita", "Pâtes fraîches"],
      busyHours: ["19:00-22:00", "Weekend"],
      priceRange: "Moyen (12-18€)",
      atmosphere: "Chaleureuse et familiale",
      strengths: ["Cuisine maison", "Tradition", "Four à bois"],
      challenges: ["Gestion de l'affluence", "Service de livraison"],
      aiRecommendations: [
        "Mettre en avant les spécialités maison dans les recommandations",
        "Optimiser les suggestions pour les heures de pointe",
        "Proposer des menus famille pour le weekend",
        "Améliorer l'efficacité du service de livraison"
      ],
      confidence: 0.92
    };
  };

  const saveSessionAnalysis = async (storeId: string, analysis: SessionAnalysis) => {
    try {
      const response = await fetch(`/api/ai/voice-onboarding/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          responses,
          sessionDuration: elapsedTime,
          completedAt: new Date()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (analysis) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Session terminée avec succès !
          </CardTitle>
          <CardDescription>
            Voici l'analyse de votre restaurant basée sur notre conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résultats de l'analyse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profil de votre restaurant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Type:</strong> {analysis.restaurantType}
                </div>
                <div>
                  <strong>Cuisine:</strong> {analysis.cuisine}
                </div>
                <div>
                  <strong>Gamme de prix:</strong> {analysis.priceRange}
                </div>
                <div>
                  <strong>Ambiance:</strong> {analysis.atmosphere}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clientèle cible</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.targetCustomers.map((customer, index) => (
                    <Badge key={index} variant="secondary">
                      {customer}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3">
                  <strong>Heures de pointe:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {analysis.busyHours.map((hour, index) => (
                      <Badge key={index} variant="outline">
                        {hour}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spécialités</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {analysis.specialties.map((specialty, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      {specialty}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Points forts et défis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong className="text-green-600">Forces:</strong>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong className="text-orange-600">Défis:</strong>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {analysis.challenges.map((challenge, index) => (
                      <li key={index}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommandations IA */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Brain className="h-5 w-5" />
                Recommandations IA personnalisées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.aiRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-blue-700">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                    {rec}
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Confiance de l'analyse:</strong> {Math.round(analysis.confidence * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onSkip}>
              Modifier l'analyse
            </Button>
            <Button onClick={() => onComplete(analysis)}>
              Appliquer la configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mic className="h-6 w-6 text-primary" />
          Session d'onboarding vocal IA
        </CardTitle>
        <CardDescription>
          4 minutes pour comprendre parfaitement votre restaurant et configurer l'IA automatiquement
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isActive ? (
          // État initial
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Mic className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Comment ça marche ?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Notre IA va vous poser quelques questions sur votre restaurant. 
                  Répondez naturellement - l'IA analysera vos réponses pour configurer 
                  automatiquement votre système avec une précision maximale.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="text-center p-4 border rounded-lg">
                <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium">Questions ciblées</h4>
                <p className="text-sm text-muted-foreground">6 questions pour comprendre votre activité</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-medium">Analyse IA</h4>
                <p className="text-sm text-muted-foreground">Intelligence artificielle avancée</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Settings className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-medium">Configuration auto</h4>
                <p className="text-sm text-muted-foreground">Zéro maintenance requise</p>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={onSkip}>
                Passer cette étape
              </Button>
              <Button onClick={startSession} size="lg" className="px-8">
                <Mic className="mr-2 h-4 w-4" />
                Commencer la session
              </Button>
            </div>
          </div>
        ) : (
          // Session active
          <div className="space-y-6">
            {/* Header avec temps et progrès */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  Question {currentQuestionIndex + 1} / {totalQuestions}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Temps restant: {formatTime(remainingTime)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <Button variant="outline" size="sm" onClick={resumeSession}>
                    <Play className="h-4 w-4 mr-2" />
                    Reprendre
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={pauseSession}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={stopSession}>
                  <Square className="h-4 w-4 mr-2" />
                  Arrêter
                </Button>
              </div>
            </div>

            {/* Barre de progrès */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progrès de la session</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question actuelle */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Volume2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">IA Assistant</h3>
                    <p className="text-base leading-relaxed">{currentQuestion?.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* État d'enregistrement */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                      <p className="text-lg font-medium">Analyse de votre réponse...</p>
                      <p className="text-muted-foreground">L'IA traite vos informations</p>
                    </>
                  ) : isRecording ? (
                    <>
                      <div className="relative">
                        <Mic className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                      </div>
                      <p className="text-lg font-medium text-red-600">🎙️ Enregistrement en cours...</p>
                      <p className="text-muted-foreground">Parlez naturellement, prenez votre temps</p>
                      <Button variant="outline" onClick={stopRecording}>
                        <Square className="h-4 w-4 mr-2" />
                        Terminer ma réponse
                      </Button>
                    </>
                  ) : currentResponse ? (
                    <>
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="text-lg font-medium text-green-600">Réponse enregistrée !</p>
                      <div className="bg-muted p-4 rounded-lg text-left max-w-2xl mx-auto">
                        <p className="text-sm italic">"{currentResponse}"</p>
                      </div>
                    </>
                  ) : isPaused ? (
                    <>
                      <Pause className="h-12 w-12 text-orange-500 mx-auto" />
                      <p className="text-lg font-medium text-orange-600">Session en pause</p>
                      <p className="text-muted-foreground">Cliquez sur "Reprendre" pour continuer</p>
                    </>
                  ) : (
                    <>
                      <MicOff className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-lg font-medium">En attente de votre réponse...</p>
                      <p className="text-muted-foreground">L'IA va commencer l'enregistrement automatiquement</p>
                    </>
                  )}

                  {isRecording && (
                    <Button variant="ghost" onClick={skipQuestion} className="mt-4">
                      <SkipForward className="h-4 w-4 mr-2" />
                      Passer cette question
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Questions précédentes */}
            {Object.keys(responses).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Réponses précédentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(responses).map(([questionId, response]) => {
                    const question = VOICE_QUESTIONS.find(q => q.id === questionId);
                    return (
                      <div key={questionId} className="border-l-4 border-primary/20 pl-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          {question?.text}
                        </p>
                        <p className="text-sm italic mt-1">"{response}"</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VoiceOnboardingSession;