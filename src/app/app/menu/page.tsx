
'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, ShoppingBag } from 'lucide-react';

export default function MenuPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get('storeId');
    const action = searchParams.get('action');

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

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="container mx-auto px-4 py-6 space-y-8 relative z-10"
            >
                <motion.header variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">Gestion du Catalogue</h1>
                        <p className="text-gray-400">Boutique ID: {storeId || "N/A"}</p>
                    </div>
                    <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-2xl">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un article
                    </Button>
                </motion.header>

                <motion.div variants={itemVariants}>
                    <Card className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Package className="h-6 w-6 text-blue-400" />
                                Catalogue de la boutique
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                C'est ici que vous gérerez les produits et services de votre boutique.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-20 border-2 border-dashed border-white/20 rounded-2xl bg-white/5">
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 rounded-2xl bg-white/10 border border-white/20">
                                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Prochaine étape</h3>
                                <p className="text-gray-400 mb-6">L'éditeur de catalogue sera implémenté ici.</p>
                                <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-2xl">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Commencer à créer votre catalogue
                                </Button>
                            </div>
                        </CardContent>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full" />
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    )
}
