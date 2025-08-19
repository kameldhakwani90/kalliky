import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

// Service de notification email (à implémenter)
async function sendEmail(to: string, subject: string, content: string) {
  // Simulation - À remplacer par un vrai service email
  console.log(`Email envoyé à ${to}: ${subject}`);
  return { success: true, messageId: `email_${Date.now()}` };
}

// Service de notification SMS (à implémenter)
async function sendSMS(to: string, content: string) {
  // Simulation - À remplacer par un vrai service SMS
  console.log(`SMS envoyé à ${to}: ${content}`);
  return { success: true, messageId: `sms_${Date.now()}` };
}

// Service de notification interne
async function createNotification(userId: string, title: string, content: string, priority: string) {
  // Simulation - À remplacer par un vrai système de notifications
  console.log(`Notification pour ${userId}: ${title} (${priority})`);
  return { success: true, notificationId: `notif_${Date.now()}` };
}

export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!storeId) {
      return NextResponse.json({ 
        error: 'storeId requis' 
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

    // Construire la requête
    const whereClause: any = {
      callLog: {
        storeId
      }
    };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    // Récupérer les actions
    const actions = await prisma.action.findMany({
      where: whereClause,
      include: {
        callLog: {
          select: {
            id: true,
            phoneNumber: true,
            timestamp: true,
            intent: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Statistiques des actions
    const stats = await prisma.action.groupBy({
      by: ['status', 'type'],
      where: {
        callLog: {
          storeId
        }
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      actions: actions.map(action => ({
        id: action.id,
        type: action.type,
        status: action.status,
        priority: (action.data as any)?.priority,
        description: (action.data as any)?.description,
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
        callLog: action.callLog
      })),
      stats: {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        byType: stats.reduce((acc, stat) => {
          acc[stat.type] = (acc[stat.type] || 0) + stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      totalActions: actions.length
    });

  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des actions' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { actionId, execute = false } = body;

    if (!actionId) {
      return NextResponse.json({ 
        error: 'actionId requis' 
      }, { status: 400 });
    }

    // Récupérer l'action avec les informations du call et du customer
    const action = await prisma.action.findFirst({
      where: {
        id: actionId,
        callLog: {
          store: {
            business: {
              ownerId: session.user.id
            }
          }
        }
      },
      include: {
        callLog: {
          include: {
            customer: true,
            store: {
              include: {
                business: true
              }
            }
          }
        }
      }
    });

    if (!action) {
      return NextResponse.json({ 
        error: 'Action non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    if (action.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Action déjà traitée' 
      }, { status: 400 });
    }

    if (!execute) {
      // Retourner juste les détails de l'action
      return NextResponse.json({
        action: {
          id: action.id,
          type: action.type,
          status: action.status,
          data: action.data,
          callLog: action.callLog,
          canExecute: true
        }
      });
    }

    // Exécuter l'action
    let executionResult = null;
    let newStatus = 'completed';

    try {
      const actionData = action.data as any;
      
      switch (action.type) {
        case 'email':
          if (action.callLog.customer?.email) {
            const subject = `Suite à votre appel - ${action.callLog.store.business.name}`;
            const content = actionData.suggestedContent || 'Merci pour votre appel.';
            
            executionResult = await sendEmail(
              action.callLog.customer.email,
              subject,
              content
            );
          } else {
            throw new Error('Aucun email client disponible');
          }
          break;

        case 'sms':
          if (action.callLog.customer?.phone) {
            const content = actionData.suggestedContent || 'Merci pour votre appel.';
            
            executionResult = await sendSMS(
              action.callLog.customer.phone,
              content
            );
          } else {
            throw new Error('Aucun téléphone client disponible');
          }
          break;

        case 'notification':
          executionResult = await createNotification(
            session.user.id,
            actionData.description || 'Nouvelle notification',
            `Appel de ${action.callLog.phoneNumber} - ${action.callLog.intent}`,
            actionData.priority || 'medium'
          );
          break;

        case 'callback':
          // Pour les callbacks, on crée juste une tâche
          executionResult = {
            success: true,
            taskId: `callback_${Date.now()}`,
            message: 'Rappel programmé'
          };
          break;

        default:
          throw new Error(`Type d'action non supporté: ${action.type}`);
      }

    } catch (error) {
      console.error('Error executing action:', error);
      newStatus = 'failed';
      executionResult = {
        success: false,
        error: (error as Error).message
      };
    }

    // Mettre à jour l'action
    const updatedAction = await prisma.action.update({
      where: { id: actionId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
        data: {
          ...actionData,
          executionResult,
          executedAt: new Date(),
          executedBy: session.user.id
        }
      }
    });

    // Mettre à jour les flags du call log si c'est un email
    if (action.type === 'email' && newStatus === 'completed') {
      await prisma.callLog.update({
        where: { id: action.callLogId },
        data: { emailSent: true }
      });
    }

    return NextResponse.json({
      success: true,
      action: updatedAction,
      executionResult
    });

  } catch (error) {
    console.error('Error executing action:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'exécution de l\'action' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { actionIds, status, bulkExecute = false } = body;

    if (!actionIds || !Array.isArray(actionIds)) {
      return NextResponse.json({ 
        error: 'actionIds array requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès aux actions
    const actions = await prisma.action.findMany({
      where: {
        id: { in: actionIds },
        callLog: {
          store: {
            business: {
              ownerId: session.user.id
            }
          }
        }
      },
      include: {
        callLog: {
          include: {
            customer: true
          }
        }
      }
    });

    if (actions.length !== actionIds.length) {
      return NextResponse.json({ 
        error: 'Certaines actions non trouvées ou accès non autorisé' 
      }, { status: 404 });
    }

    let results = [];

    if (bulkExecute) {
      // Exécuter toutes les actions en lot
      for (const action of actions) {
        if (action.status === 'pending') {
          try {
            // Exécuter l'action (logique similaire au POST)
            await prisma.action.update({
              where: { id: action.id },
              data: {
                status: 'completed',
                updatedAt: new Date()
              }
            });
            results.push({ actionId: action.id, success: true });
          } catch (error) {
            results.push({ 
              actionId: action.id, 
              success: false, 
              error: (error as Error).message 
            });
          }
        } else {
          results.push({ 
            actionId: action.id, 
            success: false, 
            error: 'Action déjà traitée' 
          });
        }
      }
    } else if (status) {
      // Mise à jour de statut en lot
      await prisma.action.updateMany({
        where: {
          id: { in: actionIds }
        },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      results = actionIds.map(id => ({ actionId: id, success: true }));
    }

    return NextResponse.json({
      success: true,
      results,
      processed: results.length
    });

  } catch (error) {
    console.error('Error bulk updating actions:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour en lot' 
    }, { status: 500 });
  }
}