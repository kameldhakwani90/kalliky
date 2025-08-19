import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

// Fonction d'analyse intelligente du catalogue
function analyzeCatalog(content: string, businessCategory: string) {
  // Simulation d'analyse IA - à remplacer par un vrai service IA
  const lines = content.split('\n').filter(line => line.trim());
  
  let serviceName = "Service Principal";
  const categories: any[] = [];
  let currentCategory: any = null;

  // Exemples selon le type de business
  const businessTypes: Record<string, any> = {
    AUTOMOTIVE: {
      serviceName: "Location Véhicules",
      categoryPatterns: ["ECONOMIQUE", "FAMILIALE", "LUXE", "UTILITAIRE"],
      pricePattern: /(\d+)€/
    },
    BEAUTY: {
      serviceName: "Soins Esthétiques", 
      categoryPatterns: ["HYDRATANT", "ANTI-AGE", "PURIFIANT", "RELAXANT"],
      pricePattern: /(\d+)€/
    },
    RESTAURANT: {
      serviceName: "Tables Restaurant",
      categoryPatterns: ["SALLE PRINCIPALE", "SALON PRIVE", "TERRASSE", "VIP"],
      pricePattern: /(\d+)€/
    }
  };

  const businessConfig = businessTypes[businessCategory] || businessTypes.RESTAURANT;
  serviceName = businessConfig.serviceName;

  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    // Détection de service principal
    if (upperLine.includes("LOCATION") || upperLine.includes("SOINS") || upperLine.includes("TABLES")) {
      serviceName = line.trim();
      continue;
    }

    // Détection de catégorie
    const isCategory = businessConfig.categoryPatterns.some((pattern: string) => upperLine.includes(pattern));
    if (isCategory) {
      if (currentCategory) {
        categories.push(currentCategory);
      }
      currentCategory = {
        name: line.trim().replace(':', ''),
        description: `Catégorie ${line.trim().replace(':', '').toLowerCase()}`,
        products: []
      };
      continue;
    }

    // Détection de produit
    if (currentCategory && line.includes('-')) {
      const parts = line.split('-');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const description = parts[1].trim();
        
        // Extraction du prix
        const priceMatch = description.match(businessConfig.pricePattern);
        const price = priceMatch ? parseInt(priceMatch[1]) : null;

        currentCategory.products.push({
          name,
          description,
          pricing: price ? {
            basePrice: price,
            currency: 'EUR',
            unit: businessCategory === 'AUTOMOTIVE' ? 'jour' : 
                  businessCategory === 'BEAUTY' ? 'séance' : 'réservation'
          } : null,
          specifications: {
            category: currentCategory.name,
            businessType: businessCategory
          }
        });
      }
    }
  }

  // Ajouter la dernière catégorie
  if (currentCategory) {
    categories.push(currentCategory);
  }

  // Si aucune catégorie détectée, créer une catégorie par défaut
  if (categories.length === 0) {
    categories.push({
      name: "Catégorie Principale",
      description: "Services principaux",
      products: [
        {
          name: "Service Standard",
          description: "Service de base",
          pricing: { basePrice: 50, currency: 'EUR', unit: 'unité' },
          specifications: { businessType: businessCategory }
        }
      ]
    });
  }

  return {
    serviceName,
    categories
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, content, businessCategory } = body;

    if (!storeId || !content || !businessCategory) {
      return NextResponse.json({ 
        error: 'storeId, content et businessCategory requis' 
      }, { status: 400 });
    }

    // Analyse du catalogue
    const result = analyzeCatalog(content, businessCategory);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error analyzing catalog:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'analyse du catalogue' 
    }, { status: 500 });
  }
}