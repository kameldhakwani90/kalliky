// ============================================================================
// EXPORT SERVICE - Génération de rapports CSV, Excel, PDF
// ============================================================================

import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import { redisService } from './redis';

export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type ExportType = 'calls' | 'orders' | 'customers' | 'analytics' | 'revenue';

export interface ExportRequest {
  businessId: string;
  storeId?: string;
  type: ExportType;
  format: ExportFormat;
  dateRange: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, any>;
  columns?: string[];
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
  metadata?: {
    totalRecords: number;
    fileSize: number;
    generatedAt: Date;
  };
}

export class ExportService {
  
  /**
   * Génère un export de données selon les paramètres
   */
  static async generateExport(request: ExportRequest): Promise<ExportResult> {
    try {
      console.log(`📊 Génération export ${request.type} (${request.format})`, {
        businessId: request.businessId,
        dateRange: request.dateRange
      });
      
      // Récupérer les données selon le type
      const data = await this.fetchDataForExport(request);
      
      if (data.length === 0) {
        return {
          success: false,
          error: 'Aucune donnée trouvée pour la période sélectionnée'
        };
      }
      
      // Générer le fichier selon le format
      const fileResult = await this.generateFile(data, request);
      
      if (!fileResult.success) {
        return fileResult;
      }
      
      // Sauvegarder temporairement le fichier
      const storageResult = await this.storeTemporaryFile(
        fileResult.content!,
        fileResult.filename!,
        request.format
      );
      
      console.log(`✅ Export généré: ${fileResult.filename} (${data.length} enregistrements)`);
      
      return {
        success: true,
        downloadUrl: storageResult.url,
        filename: fileResult.filename,
        metadata: {
          totalRecords: data.length,
          fileSize: Buffer.byteLength(fileResult.content!),
          generatedAt: new Date()
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur génération export:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne'
      };
    }
  }
  
  /**
   * Récupère les données selon le type d'export
   */
  private static async fetchDataForExport(request: ExportRequest): Promise<any[]> {
    const { businessId, storeId, type, dateRange, filters } = request;
    
    const whereConditions: any = {};
    
    // Filtres communs
    if (storeId) {
      whereConditions.storeId = storeId;
    } else {
      whereConditions.business = { id: businessId };
    }
    
    // Filtre par date
    if (dateRange.from && dateRange.to) {
      whereConditions.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to
      };
    }
    
    // Filtres spécifiques
    if (filters) {
      Object.assign(whereConditions, filters);
    }
    
    switch (type) {
      case 'calls':
        return this.fetchCallsData(whereConditions, businessId);
        
      case 'orders':
        return this.fetchOrdersData(whereConditions, businessId);
        
      case 'customers':
        return this.fetchCustomersData(whereConditions, businessId);
        
      case 'analytics':
        return this.fetchAnalyticsData(whereConditions, businessId, dateRange);
        
      case 'revenue':
        return this.fetchRevenueData(whereConditions, businessId, dateRange);
        
      default:
        throw new Error(`Type d'export non supporté: ${type}`);
    }
  }
  
  /**
   * Récupère les données d'appels
   */
  private static async fetchCallsData(whereConditions: any, businessId: string): Promise<any[]> {
    const calls = await prisma.call.findMany({
      where: {
        businessId,
        ...whereConditions
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        business: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return calls.map(call => ({
      'ID Appel': call.id,
      'Date': call.createdAt.toLocaleDateString('fr-FR'),
      'Heure': call.createdAt.toLocaleTimeString('fr-FR'),
      'Durée (sec)': call.duration || 0,
      'Statut': call.status,
      'Numéro From': call.fromNumber,
      'Numéro To': call.toNumber,
      'Client': call.customer ? `${call.customer.firstName} ${call.customer.lastName}`.trim() : 'Inconnu',
      'Téléphone Client': call.customer?.phone || call.fromNumber,
      'Email Client': call.customer?.email || '',
      'Entreprise': call.business.name,
      'Coût (€)': call.cost || 0,
      'Résumé IA': call.aiSummary || '',
      'Sentiment': (call.metadata as any)?.sentiment || '',
      'Satisfaction': (call.metadata as any)?.satisfaction || '',
      'Fin Appel': call.endedAt ? call.endedAt.toLocaleString('fr-FR') : ''
    }));
  }
  
  /**
   * Récupère les données de commandes
   */
  private static async fetchOrdersData(whereConditions: any, businessId: string): Promise<any[]> {
    const orders = await prisma.order.findMany({
      where: {
        ...whereConditions,
        store: {
          businessId
        }
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        store: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return orders.map(order => ({
      'ID Commande': order.id,
      'Date': order.createdAt.toLocaleDateString('fr-FR'),
      'Heure': order.createdAt.toLocaleTimeString('fr-FR'),
      'Boutique': order.store.name,
      'Client': order.customer ? `${order.customer.firstName} ${order.customer.lastName}`.trim() : 'Inconnu',
      'Téléphone': order.customer?.phone || '',
      'Email': order.customer?.email || '',
      'Nombre Articles': order.items.length,
      'Articles': order.items.map(item => 
        `${item.product?.name || 'Produit supprimé'} (x${item.quantity})`
      ).join(', '),
      'Sous-total (€)': order.subtotal,
      'Taxes (€)': order.tax,
      'Total (€)': order.total,
      'Statut': order.status,
      'Type Livraison': order.deliveryType,
      'Adresse Livraison': order.deliveryAddress || '',
      'Notes': order.notes || '',
      'Préparé le': order.preparedAt ? order.preparedAt.toLocaleString('fr-FR') : '',
      'Livré le': order.deliveredAt ? order.deliveredAt.toLocaleString('fr-FR') : ''
    }));
  }
  
  /**
   * Récupère les données clients
   */
  private static async fetchCustomersData(whereConditions: any, businessId: string): Promise<any[]> {
    const customers = await prisma.customer.findMany({
      where: {
        businessId,
        ...whereConditions
      },
      include: {
        _count: {
          select: {
            orders: true,
            calls: true,
            consultations: true,
            reservations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return customers.map(customer => ({
      'ID Client': customer.id,
      'Prénom': customer.firstName,
      'Nom': customer.lastName,
      'Email': customer.email || '',
      'Téléphone': customer.phone,
      'Statut': customer.status,
      'Total Dépensé (€)': customer.totalSpent,
      'Panier Moyen (€)': customer.avgBasket,
      'Nombre Commandes': customer.orderCount,
      'Appels Reçus': customer._count.calls,
      'Consultations': customer._count.consultations,
      'Réservations': customer._count.reservations,
      'Première Visite': customer.firstSeen ? customer.firstSeen.toLocaleDateString('fr-FR') : '',
      'Dernière Activité': customer.lastSeen ? customer.lastSeen.toLocaleDateString('fr-FR') : '',
      'Date Inscription': customer.createdAt.toLocaleDateString('fr-FR')
    }));
  }
  
  /**
   * Récupère les données analytics
   */
  private static async fetchAnalyticsData(
    whereConditions: any, 
    businessId: string, 
    dateRange: { from: Date; to: Date }
  ): Promise<any[]> {
    
    const [callsStats, ordersStats, revenueStats] = await Promise.all([
      // Stats appels
      prisma.call.groupBy({
        by: ['createdAt'],
        where: {
          businessId,
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        _count: { id: true },
        _avg: { duration: true }
      }),
      
      // Stats commandes
      prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          store: { businessId },
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        _count: { id: true },
        _sum: { total: true },
        _avg: { total: true }
      }),
      
      // Stats revenus
      prisma.order.aggregate({
        where: {
          store: { businessId },
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to
          },
          status: 'completed'
        },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true }
      })
    ]);
    
    return [{
      'Période': `${dateRange.from.toLocaleDateString('fr-FR')} - ${dateRange.to.toLocaleDateString('fr-FR')}`,
      'Total Appels': callsStats.reduce((sum, stat) => sum + stat._count.id, 0),
      'Durée Moyenne Appels (sec)': callsStats.reduce((sum, stat) => sum + (stat._avg.duration || 0), 0) / callsStats.length || 0,
      'Total Commandes': ordersStats.reduce((sum, stat) => sum + stat._count.id, 0),
      'Revenus Totaux (€)': revenueStats._sum.total || 0,
      'Panier Moyen (€)': revenueStats._avg.total || 0,
      'Taux Conversion (%)': callsStats.length > 0 
        ? ((ordersStats.reduce((sum, stat) => sum + stat._count.id, 0) / callsStats.reduce((sum, stat) => sum + stat._count.id, 0)) * 100).toFixed(2)
        : 0
    }];
  }
  
  /**
   * Récupère les données de revenus
   */
  private static async fetchRevenueData(
    whereConditions: any, 
    businessId: string, 
    dateRange: { from: Date; to: Date }
  ): Promise<any[]> {
    
    const revenueByDay = await prisma.$queryRaw`
      SELECT 
        DATE(o."createdAt") as date,
        COUNT(o.id) as orders_count,
        SUM(o.total) as revenue,
        AVG(o.total) as avg_order,
        COUNT(DISTINCT o."customerId") as unique_customers
      FROM "Order" o
      INNER JOIN "Store" s ON o."storeId" = s.id
      WHERE s."businessId" = ${businessId}
        AND o."createdAt" >= ${dateRange.from}
        AND o."createdAt" <= ${dateRange.to}
        AND o.status = 'completed'
      GROUP BY DATE(o."createdAt")
      ORDER BY DATE(o."createdAt") ASC
    ` as any[];
    
    return revenueByDay.map((day: any) => ({
      'Date': new Date(day.date).toLocaleDateString('fr-FR'),
      'Nombre Commandes': parseInt(day.orders_count),
      'Revenus (€)': parseFloat(day.revenue) || 0,
      'Panier Moyen (€)': parseFloat(day.avg_order) || 0,
      'Clients Uniques': parseInt(day.unique_customers)
    }));
  }
  
  /**
   * Génère le fichier selon le format demandé
   */
  private static async generateFile(
    data: any[], 
    request: ExportRequest
  ): Promise<{ success: boolean; content?: string; filename?: string; error?: string }> {
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${request.type}_export_${timestamp}.${request.format === 'excel' ? 'xlsx' : request.format}`;
    
    try {
      switch (request.format) {
        case 'csv':
          return {
            success: true,
            content: this.generateCSV(data),
            filename
          };
          
        case 'excel':
          return {
            success: true,
            content: this.generateExcel(data),
            filename
          };
          
        case 'pdf':
          return {
            success: true,
            content: await this.generatePDF(data, request.type),
            filename
          };
          
        default:
          return {
            success: false,
            error: `Format non supporté: ${request.format}`
          };
      }
      
    } catch (error) {
      return {
        success: false,
        error: `Erreur génération ${request.format}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
  
  /**
   * Génère un fichier CSV
   */
  private static generateCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Échapper les guillemets et virgules
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }
  
  /**
   * Génère un fichier Excel
   */
  private static generateExcel(data: any[]): string {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
    
    // Générer le buffer Excel
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer' 
    });
    
    return excelBuffer.toString('base64');
  }
  
  /**
   * Génère un fichier PDF (simplifié)
   */
  private static async generatePDF(data: any[], type: string): Promise<string> {
    // Pour une vraie implémentation, utiliser une librairie comme puppeteer ou jsPDF
    // Ici on génère un PDF simple en HTML converti
    
    const html = `
      <html>
        <head>
          <title>Export ${type}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Export ${type}</h1>
            <p>Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Nombre d'enregistrements: ${data.length}</p>
          </div>
          
          ${data.length > 0 ? `
            <table>
              <thead>
                <tr>
                  ${Object.keys(data[0]).map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${Object.values(row).map(value => `<td>${value || ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>Aucune donnée à afficher</p>'}
        </body>
      </html>
    `;
    
    // Retourner le HTML encodé en base64 (dans une vraie implémentation, on convertirait en PDF)
    return Buffer.from(html).toString('base64');
  }
  
  /**
   * Stocke temporairement le fichier généré
   */
  private static async storeTemporaryFile(
    content: string,
    filename: string,
    format: ExportFormat
  ): Promise<{ url: string }> {
    
    // Stocker dans Redis avec TTL de 24h
    await redisService.connect();
    const fileKey = `export_file:${filename}`;
    
    const fileData = {
      content,
      filename,
      format,
      createdAt: new Date().toISOString(),
      contentType: this.getContentType(format)
    };
    
    await redisService.client.setEx(fileKey, 86400, JSON.stringify(fileData)); // 24h TTL
    
    // Retourner l'URL de téléchargement
    return {
      url: `/api/exports/download/${encodeURIComponent(filename)}`
    };
  }
  
  /**
   * Récupère un fichier temporaire
   */
  static async getTemporaryFile(filename: string): Promise<{
    success: boolean;
    content?: string;
    contentType?: string;
    error?: string;
  }> {
    
    try {
      await redisService.connect();
      const fileKey = `export_file:${filename}`;
      const fileData = await redisService.client.get(fileKey);
      
      if (!fileData) {
        return {
          success: false,
          error: 'Fichier expiré ou introuvable'
        };
      }
      
      const parsed = JSON.parse(fileData as string);
      
      return {
        success: true,
        content: parsed.content,
        contentType: parsed.contentType
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la récupération du fichier'
      };
    }
  }
  
  /**
   * Nettoie les fichiers expirés
   */
  static async cleanupExpiredFiles(): Promise<void> {
    await redisService.connect();
    
    const pattern = 'export_file:*';
    const keys = await redisService.client.keys(pattern);
    
    let cleaned = 0;
    for (const key of keys) {
      const ttl = await redisService.client.ttl(key);
      if (ttl <= 0) {
        await redisService.client.del(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Nettoyé ${cleaned} fichiers d'export expirés`);
    }
  }
  
  /**
   * Détermine le content type selon le format
   */
  private static getContentType(format: ExportFormat): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}