import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function debugAdminAPI() {
  try {
    console.log('🔍 Debug API admin...');
    
    // 1. Vérifier les données en base directement
    const configs = await prisma.businessCategoryConfig.findMany({
      select: {
        id: true,
        category: true,
        displayName: true,
        systemPrompt: true,
        menuExtractionPrompt: true
      },
      orderBy: { displayName: 'asc' }
    });
    
    console.log('📊 Données en base:');
    configs.forEach(config => {
      console.log(`${config.category}:`);
      console.log(`  - systemPrompt: ${config.systemPrompt ? config.systemPrompt.substring(0, 50) + '...' : 'NULL'}`);
      console.log(`  - menuExtractionPrompt: ${config.menuExtractionPrompt ? config.menuExtractionPrompt.substring(0, 50) + '...' : 'NULL'}`);
      console.log('');
    });
    
    // 2. Créer un token de test pour tester l'API
    const testToken = jwt.sign(
      { userId: 'test', email: 'admin@test.com', role: 'SUPER_ADMIN' },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    console.log('🔑 Token de test généré:', testToken.substring(0, 50) + '...');
    
    // 3. Test HTTP direct
    const response = await fetch('http://localhost:9002/api/admin/business-types', {
      headers: {
        'Cookie': `auth-token=${testToken}`
      }
    });
    
    console.log('📡 Réponse API:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Données API:', data.length, 'configurations');
      
      const restaurant = data.find((c: any) => c.category === 'RESTAURANT');
      if (restaurant) {
        console.log('🍽️ Config RESTAURANT via API:');
        console.log('  - Clés disponibles:', Object.keys(restaurant));
        console.log('  - menuExtractionPrompt:', restaurant.menuExtractionPrompt ? 'EXISTS' : 'NULL');
        console.log('  - Valeur exacte:', restaurant.menuExtractionPrompt);
      }
      
      // Afficher la première config complète pour debug
      console.log('🔍 Première config complète:', JSON.stringify(data[0], null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Erreur API:', error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminAPI();