import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const menuPrompts = {
  'FITNESS': `Vous êtes un expert en analyse de documents fitness et bien-être. Analysez cette image de menu/tarifs et extrayez UNIQUEMENT les informations visibles.

RÈGLES IMPORTANTES :
- Analysez seulement ce qui est visible dans l'image
- Ne créez JAMAIS de produits génériques ou d'exemples
- Si aucun produit n'est visible clairement, retournez une liste vide
- Respectez exactement les noms et prix affichés

FORMAT DE RÉPONSE REQUIS (JSON strict) :
{
  "products": [
    {
      "name": "[Nom exact du service/abonnement]",
      "description": "[Description si visible, sinon service fitness]",
      "basePrice": [prix en centimes],
      "category": "[FITNESS_SERVICE|MEMBERSHIPS|PERSONAL_TRAINING|GROUP_CLASSES|SUPPLEMENTS|EQUIPMENT]",
      "components": [
        {
          "name": "[Type de service]",
          "basePrice": [prix en centimes],
          "category": "[FITNESS_SERVICE|MEMBERSHIPS|PERSONAL_TRAINING|GROUP_CLASSES|SUPPLEMENTS|EQUIPMENT]"
        }
      ],
      "variations": [
        {
          "name": "[Durée/Type si applicable]",
          "priceDifference": [différence en centimes, peut être négative],
          "category": "[DURATION|MEMBERSHIP_TYPE|TRAINING_TYPE]"
        }
      ]
    }
  ]
}

CATÉGORIES FITNESS :
- FITNESS_SERVICE : Services généraux
- MEMBERSHIPS : Abonnements salle
- PERSONAL_TRAINING : Coaching personnel  
- GROUP_CLASSES : Cours collectifs
- SUPPLEMENTS : Compléments alimentaires
- EQUIPMENT : Matériel/Équipement

VARIATION CATEGORIES :
- DURATION : 1 mois, 3 mois, 6 mois, 1 an
- MEMBERSHIP_TYPE : Basic, Premium, VIP
- TRAINING_TYPE : Individuel, Duo, Groupe

Analysez maintenant cette image et extrayez les services fitness visibles.`
};

async function injectMenuPrompts() {
  try {
    console.log('🔄 Injection des prompts d\'extraction de menu...');
    
    // D'abord, lister toutes les configurations existantes
    const configs = await prisma.businessCategoryConfig.findMany({
      select: { id: true, category: true, displayName: true }
    });
    
    console.log('📋 Configurations existantes:', configs);
    
    // Injecter les prompts pour chaque catégorie
    for (const [category, prompt] of Object.entries(menuPrompts)) {
      const config = configs.find(c => c.category === category);
      
      if (config) {
        await prisma.businessCategoryConfig.update({
          where: { id: config.id },
          data: { menuExtractionPrompt: prompt }
        });
        console.log(`✅ Prompt injecté pour ${category}`);
      } else {
        console.log(`⚠️  Configuration ${category} non trouvée`);
      }
    }
    
    // Vérifier les résultats
    const updated = await prisma.businessCategoryConfig.findMany({
      select: { 
        category: true, 
        displayName: true,
        menuExtractionPrompt: true
      }
    });
    
    console.log('📊 Résultats:');
    updated.forEach(config => {
      console.log(`${config.category}: ${config.menuExtractionPrompt ? 'PROMPT OK' : 'VIDE'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

injectMenuPrompts();