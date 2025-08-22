import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newRestaurantPrompt = `Vous êtes un expert en analyse de menus/catalogues restaurant. Analysez ce document (image/PDF/Excel) et extrayez AUTOMATIQUEMENT toutes les informations visibles.

🎯 MISSION : Créer le catalogue complet avec détection automatique des catégories, tailles, et compositions

📋 RÈGLES STRICTES :
- Analysez TOUT le document de façon exhaustive
- Détectez automatiquement les catégories depuis les titres/sections du document
- Si aucun produit visible, retournez {"products": []}
- Respectez exactement les noms et prix du document
- Ne jamais inventer de produits génériques

🔍 DÉTECTION AUTOMATIQUE :
1. **CATÉGORIES** : Cherchez les titres/sections (PIZZA, BURGERS, DESSERTS, BOISSONS, etc.)
2. **TAILLES** : Détectez automatiquement (Petite/Moyenne/Grande, S/M/L, 20cm/30cm/40cm, etc.)
3. **COMPOSITIONS/ÉTAPES** : Pour produits comme tacos, sandwichs - listez chaque étape/ingrédient visible
4. **PRIX VARIABLES** : Capturez tous les prix selon tailles/options

📊 FORMAT RÉPONSE (JSON OBLIGATOIRE) :
{
  "products": [
    {
      "name": "[NOM EXACT du produit]",
      "description": "[Description complète si visible]", 
      "basePrice": [prix le plus bas en centimes],
      "category": "[CATÉGORIE DÉTECTÉE depuis le document]",
      "components": [
        {
          "name": "[Ingrédient/Étape de composition]",
          "basePrice": [prix si spécifié, sinon 0],
          "category": "[Même catégorie que le produit parent]"
        }
      ],
      "variations": [
        {
          "name": "[Taille/Option détectée]",
          "priceDifference": [différence en centimes par rapport au basePrice],
          "category": "[SIZE|OPTION|SUPPLEMENT]"
        }
      ]
    }
  ]
}

🍕 EXEMPLE DÉTECTION :
**Si le document montre :**
- Titre : "NOS PIZZAS" 
- Pizza Margherita : Petite 8€, Moyenne 12€, Grande 16€
- Ingrédients : Base tomate, Mozzarella, Basilic

**Résultat attendu :**
{
  "name": "Pizza Margherita",
  "basePrice": 800,
  "category": "PIZZAS",
  "components": [
    {"name": "Base tomate", "basePrice": 0, "category": "PIZZAS"},
    {"name": "Mozzarella", "basePrice": 0, "category": "PIZZAS"},
    {"name": "Basilic", "basePrice": 0, "category": "PIZZAS"}
  ],
  "variations": [
    {"name": "Petite", "priceDifference": 0, "category": "SIZE"},
    {"name": "Moyenne", "priceDifference": 400, "category": "SIZE"},
    {"name": "Grande", "priceDifference": 800, "category": "SIZE"}
  ]
}

🌮 EXEMPLE COMPOSITION ÉTAPES (Tacos) :
**Si détecté : "Tacos Poulet - Étapes : 1.Galette, 2.Poulet grillé, 3.Crudités, 4.Sauce"**
{
  "name": "Tacos Poulet",
  "basePrice": [prix_détecté],
  "category": "TACOS", 
  "components": [
    {"name": "Étape 1: Galette", "basePrice": 0, "category": "TACOS"},
    {"name": "Étape 2: Poulet grillé", "basePrice": 0, "category": "TACOS"},
    {"name": "Étape 3: Crudités", "basePrice": 0, "category": "TACOS"},
    {"name": "Étape 4: Sauce", "basePrice": 0, "category": "TACOS"}
  ]
}

💡 INTELLIGENCE REQUISE :
- Reliez automatiquement chaque produit à sa catégorie détectée
- Capturez toutes les variations de prix (tailles, options)
- Listez les étapes de composition quand visibles
- Gardez les noms exacts du document (pas de traduction)

🚀 ANALYSEZ MAINTENANT ce document et créez le catalogue complet !`;

async function updateRestaurantPrompt() {
  try {
    console.log('🔄 Mise à jour du prompt RESTAURANT...');
    
    const updated = await prisma.businessCategoryConfig.update({
      where: { category: 'RESTAURANT' },
      data: { menuExtractionPrompt: newRestaurantPrompt }
    });
    
    console.log('✅ Prompt RESTAURANT mis à jour avec succès');
    console.log('📝 Nouvelles fonctionnalités:');
    console.log('- 🎯 Détection automatique des catégories depuis les titres');  
    console.log('- 📏 Détection automatique des tailles et prix variables');
    console.log('- 🔧 Extraction des étapes de composition (ex: tacos)');
    console.log('- 🍕 Liaison automatique produits → catégories détectées');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRestaurantPrompt();