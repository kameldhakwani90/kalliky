import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Fonction pour calculer la similarité entre deux chaînes (simple algorithme de Levenshtein)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const storeId = searchParams.get('storeId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minScore = parseFloat(searchParams.get('minScore') || '0.3');

    if (!query || !storeId) {
      return NextResponse.json({ 
        error: 'Query et storeId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Construire la requête de base
    const whereClause: any = { storeId };
    if (category) {
      whereClause.category = {
        name: {
          equals: category,
          mode: 'insensitive'
        }
      };
    }

    // Récupérer tous les composants du store
    const allComponents = await prisma.component.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        usageStats: {
          select: {
            totalUsage: true,
            customerAcceptanceRate: true,
            averageRating: true
          }
        }
      }
    });

    // Effectuer la recherche et calculer les scores de pertinence
    const searchResults = allComponents
      .map(component => {
        let score = 0;
        let matchType = '';

        // Recherche exacte dans le nom
        if (component.name.toLowerCase() === query.toLowerCase()) {
          score = 1.0;
          matchType = 'exact_name';
        }
        // Recherche dans les variations
        else if (component.variations.some(v => v.toLowerCase() === query.toLowerCase())) {
          score = 0.95;
          matchType = 'exact_variation';
        }
        // Recherche dans les alias
        else if (component.aliases.some(a => a.toLowerCase() === query.toLowerCase())) {
          score = 0.9;
          matchType = 'exact_alias';
        }
        // Recherche partielle dans le nom
        else if (component.name.toLowerCase().includes(query.toLowerCase())) {
          score = 0.8;
          matchType = 'partial_name';
        }
        // Recherche partielle dans les variations
        else if (component.variations.some(v => v.toLowerCase().includes(query.toLowerCase()))) {
          score = 0.7;
          matchType = 'partial_variation';
        }
        // Recherche partielle dans les alias
        else if (component.aliases.some(a => a.toLowerCase().includes(query.toLowerCase()))) {
          score = 0.65;
          matchType = 'partial_alias';
        }
        // Recherche par similarité
        else {
          const nameSimilarity = calculateSimilarity(component.name, query);
          const variationSimilarity = Math.max(
            ...component.variations.map(v => calculateSimilarity(v, query)),
            0
          );
          const aliasSimilarity = Math.max(
            ...component.aliases.map(a => calculateSimilarity(a, query)),
            0
          );
          
          score = Math.max(nameSimilarity, variationSimilarity, aliasSimilarity);
          matchType = 'similarity';
        }

        // Bonus pour les composants populaires
        if (component.usageStats.length > 0) {
          const avgUsage = component.usageStats.reduce((sum, stat) => sum + stat.totalUsage, 0) / component.usageStats.length;
          const usageBonus = Math.min(avgUsage / 100, 0.1); // Max 10% bonus
          score += usageBonus;
        }

        // Bonus pour les composants bien notés
        if (component.usageStats.length > 0) {
          const avgRating = component.usageStats.reduce((sum, stat) => sum + (stat.averageRating || 0), 0) / component.usageStats.length;
          const ratingBonus = (avgRating / 5) * 0.05; // Max 5% bonus
          score += ratingBonus;
        }

        return {
          ...component,
          searchScore: Math.min(score, 1.0), // Cap à 1.0
          matchType,
          usageStats: component.usageStats[0] || null
        };
      })
      .filter(component => component.searchScore >= minScore)
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, limit);

    return NextResponse.json({
      results: searchResults,
      totalResults: searchResults.length,
      query,
      minScore,
      searchSummary: {
        exact: searchResults.filter(r => r.matchType.startsWith('exact')).length,
        partial: searchResults.filter(r => r.matchType.startsWith('partial')).length,
        similarity: searchResults.filter(r => r.matchType === 'similarity').length
      }
    });

  } catch (error) {
    console.error('Error searching components:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la recherche' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, storeId, autoCreate = false } = body;

    if (!text || !storeId) {
      return NextResponse.json({ 
        error: 'Texte et storeId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Rechercher le meilleur match pour ce texte
    const searchResponse = await fetch(`${request.nextUrl.origin}/api/components/search?q=${encodeURIComponent(text)}&storeId=${storeId}&limit=1`, {
      headers: {
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    const searchData = await searchResponse.json();
    const bestMatch = searchData.results?.[0];

    if (bestMatch && bestMatch.searchScore > 0.8) {
      // Match suffisamment bon trouvé
      return NextResponse.json({
        found: true,
        component: bestMatch,
        confidence: bestMatch.searchScore,
        suggestion: 'existing_component'
      });
    }

    if (autoCreate) {
      // Créer automatiquement un nouveau composant
      // Pour l'instant, retourner juste une suggestion de création
      return NextResponse.json({
        found: false,
        suggestion: 'create_component',
        recommendedName: text,
        confidence: 0,
        autoCreateReady: true
      });
    }

    return NextResponse.json({
      found: false,
      bestMatch: bestMatch || null,
      suggestion: bestMatch ? 'review_match' : 'create_component',
      confidence: bestMatch?.searchScore || 0
    });

  } catch (error) {
    console.error('Error in intelligent component mapping:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du mapping intelligent' 
    }, { status: 500 });
  }
}