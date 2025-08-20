'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, PhoneCall, Clock, User, Bot, PlayCircle, ShoppingBag, Calendar, BrainCircuit, AlertTriangle, Check, Ban, MessageSquare, Volume2, Receipt, Star, Printer, Phone, Flag, FileText, UserX } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface TicketData {
    id: string;
    date: string;
    duration?: string | null;
    customer: {
        phone: string;
        firstName?: string;
        lastName?: string;
    };
    activities: any[];
    total: number;
    conversation?: any;
    audioUrl?: string | null;
    transcript?: string | null;
}

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('from') || 'clients';
    const customerId = searchParams.get('customerId');
    
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [ticketId, setTicketId] = useState<string>('');

    useEffect(() => {
        const initParams = async () => {
            const resolvedParams = await params;
            setTicketId(resolvedParams.id);
        };
        initParams();
    }, [params]);

    useEffect(() => {
        const fetchTicketData = async () => {
            if (!ticketId) return;
            
            try {
                setLoading(true);
                
                const ticketResponse = await fetch(`/api/tickets/${ticketId}`);
                
                if (!ticketResponse.ok) {
                    console.error('Ticket non trouvé');
                    return;
                }
                
                const ticketData = await ticketResponse.json();
                
                const transformedTicket: TicketData = {
                    id: ticketData.id,
                    date: new Date(ticketData.date).toLocaleDateString('fr-FR'),
                    duration: ticketData.duration || null,
                    customer: {
                        phone: ticketData.customer?.phone || 'N/A',
                        firstName: ticketData.customer?.firstName,
                        lastName: ticketData.customer?.lastName
                    },
                    activities: ticketData.activities || [],
                    total: ticketData.total || 0,
                    conversation: ticketData.conversation || null,
                    audioUrl: ticketData.audioUrl || null,
                    transcript: ticketData.transcript || null
                };
                
                setTicket(transformedTicket);
            } catch (error) {
                console.error('Erreur lors du chargement du ticket:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketData();
    }, [ticketId]);

    const handleGoBack = () => {
        if (returnTo === 'activity') {
            router.push('/restaurant/activity');
        } else {
            router.push(`/restaurant/clients/${customerId}`);
        }
    };

    const formatCustomerName = () => {
        if (ticket?.customer.firstName || ticket?.customer.lastName) {
            return `${ticket.customer.firstName || ""} ${ticket.customer.lastName || ""}`.trim();
        }
        return "Client Anonyme";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket non trouve</h1>
                    <Button onClick={handleGoBack}>Retour</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <header className="glass-effect border-b border-gray-200/50 sticky top-0 z-10 shadow-apple">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-6">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleGoBack}
                                className="flex items-center gap-2 rounded-xl border-gray-300 hover:border-gray-400 transition-smooth"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
                                    <PhoneCall className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticketId}</h1>
                                    <p className="text-sm text-gray-600">{ticket.date} • {ticket.duration || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{ticket.total.toFixed(2)}€</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Récap Client en haut */}
                <Card className="glass-effect shadow-apple rounded-2xl border-0">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-20 w-20 shadow-apple">
                                <AvatarFallback className="text-xl bg-black text-white">
                                    {ticket.customer.firstName && ticket.customer.lastName 
                                        ? (ticket.customer.firstName.charAt(0) + ticket.customer.lastName.charAt(0)).toUpperCase()
                                        : '📞'
                                    }
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">{formatCustomerName()}</h2>
                                <p className="text-gray-600">{ticket.customer.phone}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <Badge variant="secondary" className="rounded-full">
                                        {ticket.activities.length} activité{ticket.activities.length > 1 ? 's' : ''}
                                    </Badge>
                                    <p className="text-sm text-gray-500">
                                        Total: <span className="font-semibold">{ticket.total.toFixed(2)}€</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Onglets principaux */}
                <Tabs defaultValue="ticket" className="space-y-6">
                    <div className="glass-effect rounded-2xl p-4 shadow-apple border-0">
                        <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-xl p-1">
                            <TabsTrigger value="ticket" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth">
                                <Receipt className="h-4 w-4 mr-2" />
                                Résumé
                            </TabsTrigger>
                            <TabsTrigger value="historique" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth">
                                <Clock className="h-4 w-4 mr-2" />
                                Historique
                            </TabsTrigger>
                            <TabsTrigger value="conversation" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Conversation
                            </TabsTrigger>
                            <TabsTrigger value="actions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth">
                                <Bot className="h-4 w-4 mr-2" />
                                Actions
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Contenu des onglets */}
                    <div className="space-y-6">
                        {/* Contenu principal */}
                        <div className="space-y-6">
                            {/* Onglet TICKET - Vue complète formatée */}
                            <TabsContent value="ticket" className="space-y-6 mt-0">
                                <Card className="glass-effect shadow-apple rounded-2xl border-0 printable-ticket">
                                    <CardContent className="p-8 space-y-6">
                                        {/* En-tête du ticket */}
                                        <div className="text-center space-y-2 border-b pb-4">
                                            <h1 className="text-3xl font-bold">PIZZA MARIO</h1>
                                            <p className="text-gray-600">Ticket #{ticketId}</p>
                                            <p className="text-sm text-gray-500">{ticket.date} • {ticket.duration || 'N/A'}</p>
                                        </div>

                                        {/* Informations client */}
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-gray-900">CLIENT</h3>
                                            <p className="font-medium">{formatCustomerName()}</p>
                                            <p className="text-gray-600">{ticket.customer.phone}</p>
                                        </div>

                                        {/* Détails par type d'activité */}
                                        <div className="space-y-6">
                                            {/* Section COMMANDES */}
                                            {ticket.activities.filter(a => a.type === 'order').map((order, index) => (
                                                <div key={index} className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingBag className="h-5 w-5 text-green-600" />
                                                        <h4 className="font-semibold">COMMANDE #{order.id}</h4>
                                                    </div>
                                                    {order.items?.map((item, itemIndex) => (
                                                        <div key={itemIndex} className="flex justify-between items-start pl-7">
                                                            <div className="flex-1">
                                                                <p className="font-medium">{item.name}</p>
                                                                <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                                                                {item.customizations?.map((custom, customIndex) => (
                                                                    <p key={customIndex} className="text-xs text-gray-500 ml-4">
                                                                        {custom.type === 'add' ? '+' : '-'} {custom.name}
                                                                        {custom.price > 0 && <span className="float-right">{custom.price.toFixed(2)}€</span>}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                            <span className="font-semibold">{item.finalPrice?.toFixed(2)}€</span>
                                                        </div>
                                                    ))}
                                                    <div className="border-t pt-2 pl-7">
                                                        <div className="flex justify-between">
                                                            <span>Sous-total:</span>
                                                            <span>{order.subtotal?.toFixed(2)}€</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Section SERVICES */}
                                            {ticket.activities.filter(a => a.type === 'service' || a.type === 'reservation').map((service, index) => (
                                                <div key={index} className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-5 w-5 text-orange-600" />
                                                        <h4 className="font-semibold">SERVICE #{service.id}</h4>
                                                    </div>
                                                    <div className="pl-7">
                                                        <p className="font-medium">{service.serviceName || service.title || 'Service'}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {service.date && service.time ? `${service.date} à ${service.time}` : 'Date à planifier'}
                                                        </p>
                                                        {service.duration && (
                                                            <p className="text-sm text-gray-600">Durée: {service.duration}</p>
                                                        )}
                                                        {service.description && (
                                                            <p className="text-sm text-gray-700 mt-1">{service.description}</p>
                                                        )}
                                                        {service.price && (
                                                            <p className="text-sm font-semibold text-orange-600 mt-1">Prix: {service.price}€</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Section CONSULTATIONS */}
                                            {ticket.activities.filter(a => a.type === 'consultation').map((consultation, index) => (
                                                <div key={index} className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <BrainCircuit className="h-5 w-5 text-purple-600" />
                                                        <h4 className="font-semibold">CONSULTATION #{consultation.id}</h4>
                                                    </div>
                                                    <div className="pl-7">
                                                        <p className="font-medium">{consultation.title || consultation.serviceName || 'Consultation'}</p>
                                                        {consultation.consultationType && (
                                                            <p className="text-sm text-gray-600">Type: {consultation.consultationType}</p>
                                                        )}
                                                        {consultation.description && (
                                                            <p className="text-sm text-gray-700 mt-1">{consultation.description}</p>
                                                        )}
                                                        {consultation.scheduledAt && (
                                                            <p className="text-sm text-gray-600">Planifié: {new Date(consultation.scheduledAt).toLocaleString('fr-FR')}</p>
                                                        )}
                                                        {consultation.status && (
                                                            <Badge variant="outline" className="mt-1 rounded-full">
                                                                {consultation.status}
                                                            </Badge>
                                                        )}
                                                        {consultation.analysis && (
                                                            <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                                                                <p className="text-xs text-purple-700">
                                                                    Analyse IA: {consultation.analysis.score > 80 ? 'Très pertinente' : 
                                                                             consultation.analysis.score > 40 ? 'Partiellement pertinente' : 'Hors domaine'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Section SIGNALEMENTS */}
                                            {ticket.activities.filter(a => a.type === 'signalement' || a.type === 'complaint').map((signalement, index) => (
                                                <div key={index} className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                                        <h4 className="font-semibold">SIGNALEMENT #{signalement.id}</h4>
                                                        <Badge variant="destructive" className="rounded-full text-xs">
                                                            {signalement.urgencyLevel === 'URGENT' ? '🚨 URGENT' : 
                                                             signalement.urgencyLevel === 'HIGH' ? '⚠️ ÉLEVÉ' :
                                                             signalement.urgencyLevel === 'NORMAL' ? '📋 NORMAL' :
                                                             '📝 FAIBLE'}
                                                        </Badge>
                                                    </div>
                                                    <div className="pl-7 space-y-2">
                                                        <p className="font-medium">{signalement.title || 'Signalement'}</p>
                                                        {signalement.problemType && (
                                                            <div className="flex items-center gap-2">
                                                                {signalement.problemType === 'produit_defectueux' && '🍞 Produit défectueux'}
                                                                {signalement.problemType === 'service_insatisfaisant' && '⏰ Service insatisfaisant'}
                                                                {signalement.problemType === 'erreur_facturation' && '💰 Erreur facturation'}
                                                                {signalement.problemType === 'autre' && '❓ Autre'}
                                                            </div>
                                                        )}
                                                        {signalement.description && (
                                                            <p className="text-sm text-gray-700">{signalement.description}</p>
                                                        )}
                                                        {signalement.status && (
                                                            <Badge variant={signalement.status === 'resolved' ? 'default' : 'secondary'} className="rounded-full">
                                                                {signalement.status === 'new' ? '📝 NOUVEAU' :
                                                                 signalement.status === 'in_progress' ? '⏳ EN COURS' :
                                                                 signalement.status === 'resolved' ? '✅ RÉSOLU' :
                                                                 '📝 NOUVEAU'}
                                                            </Badge>
                                                        )}
                                                        {signalement.assignedTo && (
                                                            <p className="text-xs text-gray-600">
                                                                Assigné à: {signalement.assignedTo}
                                                            </p>
                                                        )}
                                                        {signalement.actionsRequired && signalement.actionsRequired.length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-xs font-semibold text-gray-700">Actions requises:</p>
                                                                <ul className="text-xs text-gray-600 ml-4">
                                                                    {signalement.actionsRequired.map((action, idx) => (
                                                                        <li key={idx}>• {action}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {signalement.compensationOffered && (
                                                            <p className="text-xs text-green-600 font-medium">
                                                                💰 Compensation: {signalement.compensationOffered}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total général */}
                                        <div className="border-t-2 border-gray-900 pt-4 space-y-2">
                                            <div className="flex justify-between text-xl font-bold">
                                                <span>TOTAL</span>
                                                <span>{ticket.total.toFixed(2)}€</span>
                                            </div>
                                        </div>

                                        {/* Analyse IA si disponible */}
                                        {ticket.conversation?.aiAnalysis && (
                                            <div className="border-t pt-4 space-y-4">
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <Bot className="h-5 w-5" />
                                                    ANALYSE IA
                                                </h3>
                                                {ticket.conversation.aiAnalysis.sentiment && (
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-gray-600">Sentiment:</span>
                                                        <Badge variant={
                                                            ticket.conversation.aiAnalysis.sentiment === 'positive' ? 'default' :
                                                            ticket.conversation.aiAnalysis.sentiment === 'neutral' ? 'secondary' : 'destructive'
                                                        } className="rounded-full">
                                                            {ticket.conversation.aiAnalysis.sentiment}
                                                        </Badge>
                                                    </div>
                                                )}
                                                {ticket.conversation.aiAnalysis.keywords && (
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-2">Mots-clés détectés:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {ticket.conversation.aiAnalysis.keywords.map((keyword, index) => (
                                                                <Badge key={index} variant="outline" className="rounded-full text-xs">
                                                                    {keyword}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="text-center text-sm text-gray-500 border-t pt-4">
                                            <p>Merci de votre visite !</p>
                                            <p>Traité par IA • {new Date().toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Onglet Historique */}
                            <TabsContent value="historique" className="space-y-6 mt-0">
                                {/* Audio Player en haut */}
                                {ticket.audioUrl && (
                                    <Card className="glass-effect shadow-apple rounded-2xl border-0">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                                        <Phone className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">Enregistrement audio</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {ticket.duration} • {ticket.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => setIsPlaying(!isPlaying)}
                                                    className="flex items-center gap-2 rounded-xl"
                                                >
                                                    {isPlaying ? <Volume2 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                                    {isPlaying ? 'En cours' : 'Écouter'}
                                                </Button>
                                            </div>
                                            {ticket.audioUrl && (
                                                <audio
                                                    controls
                                                    className="w-full mt-4"
                                                    src={ticket.audioUrl}
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Timeline des activités */}
                                <Card className="glass-effect shadow-apple rounded-2xl border-0">
                                    <CardHeader>
                                        <CardTitle>Timeline des activités</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            {/* Début d'appel */}
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                    <Phone className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold">Appel entrant</p>
                                                    <p className="text-sm text-gray-600">{ticket.date}</p>
                                                </div>
                                            </div>

                                            {/* Activités par type */}
                                            {ticket.activities.map((activity, index) => (
                                                <div key={index} className="flex gap-4">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                        {activity.type === 'order' && <ShoppingBag className="h-5 w-5 text-green-600" />}
                                                        {activity.type === 'reservation' && <Calendar className="h-5 w-5 text-orange-600" />}
                                                        {activity.type === 'consultation' && <BrainCircuit className="h-5 w-5 text-purple-600" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold">
                                                            {activity.type === 'order' && `Commande #${activity.id}`}
                                                            {activity.type === 'reservation' && `Service #${activity.id}`}
                                                            {activity.type === 'consultation' && `Consultation #${activity.id}`}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {activity.timestamp || ticket.date}
                                                        </p>
                                                        {activity.description && (
                                                            <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Fin d'appel */}
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                    <Phone className="h-5 w-5 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold">Fin d'appel</p>
                                                    <p className="text-sm text-gray-600">Durée: {ticket.duration || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Onglet Conversation */}
                            <TabsContent value="conversation" className="space-y-6 mt-0">
                                <Card className="glass-effect shadow-apple rounded-2xl border-0">
                                    <CardHeader>
                                        <CardTitle>Conversation IA</CardTitle>
                                        {ticket.audioUrl && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="w-fit rounded-xl"
                                            >
                                                {isPlaying ? <Volume2 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                                {isPlaying ? 'En cours' : 'Écouter'}
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {/* Zone de conversation style messenger */}
                                        {ticket.conversation?.messages && (
                                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                                {ticket.conversation.messages.map((message, index) => (
                                                    <div
                                                        key={index}
                                                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        {message.role !== 'user' && (
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                    <Bot className="h-4 w-4" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        <div
                                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                                                message.role === 'user'
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-gray-100 text-gray-900'
                                                            }`}
                                                        >
                                                            <p className="text-sm">{message.content}</p>
                                                            {message.timestamp && (
                                                                <p className="text-xs opacity-70 mt-1">
                                                                    {new Date(message.timestamp).toLocaleTimeString('fr-FR')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {message.role === 'user' && (
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarFallback className="bg-green-100 text-green-600">
                                                                    <User className="h-4 w-4" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Transcript si pas de conversation structurée */}
                                        {!ticket.conversation?.messages && ticket.transcript && (
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                    {ticket.transcript}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Onglet Actions */}
                            <TabsContent value="actions" className="space-y-6 mt-0">
                                <Card className="glass-effect shadow-apple rounded-2xl border-0">
                                    <CardHeader>
                                        <CardTitle>Actions rapides</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Button variant="outline" className="w-full justify-start rounded-xl" size="lg">
                                                <Phone className="h-4 w-4 mr-2" />
                                                Rappeler le client
                                            </Button>
                                            <Button variant="outline" className="w-full justify-start rounded-xl" size="lg">
                                                <Printer className="h-4 w-4 mr-2" />
                                                Imprimer le ticket
                                            </Button>
                                            <Button variant="outline" className="w-full justify-start rounded-xl" size="lg">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Planifier service
                                            </Button>
                                            <Button variant="outline" className="w-full justify-start rounded-xl" size="lg">
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Envoyer SMS
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}