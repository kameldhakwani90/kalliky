import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// GET - Récupérer un ticket spécifique
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { id } = await params;
    
    // Récupérer le ticket
    const ticket = await prisma.preparationTicket.findFirst({
      where: { 
        id,
        store: {
          business: { ownerId: decoded.userId }
        }
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      orderId: ticket.orderId,
      orderNumber: ticket.order.orderNumber,
      status: ticket.status,
      priority: ticket.priority,
      items: ticket.items,
      notes: ticket.notes,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      completedAt: ticket.completedAt,
      customer: {
        id: ticket.order.customer.id,
        name: `${ticket.order.customer.firstName || ''} ${ticket.order.customer.lastName || ''}`.trim() || 'Client Anonyme',
        phone: ticket.order.customer.phone
      },
      store: ticket.store,
      orderTotal: ticket.order.total
    });

  } catch (error) {
    console.error('Error fetching preparation ticket:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour un ticket de préparation
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { id } = await params;
    const { status, priority, notes } = await request.json();
    
    // Vérifier que le ticket appartient à l'utilisateur
    const existingTicket = await prisma.preparationTicket.findFirst({
      where: { 
        id,
        store: {
          business: { ownerId: decoded.userId }
        }
      }
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status.toUpperCase();
      
      // Si le statut est COMPLETED, ajouter la date de completion
      if (status.toUpperCase() === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority.toUpperCase();
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Mettre à jour le ticket
    const updatedTicket = await prisma.preparationTicket.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      ticket: {
        id: updatedTicket.id,
        ticketNumber: updatedTicket.ticketNumber,
        orderId: updatedTicket.orderId,
        orderNumber: updatedTicket.order.orderNumber,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        items: updatedTicket.items,
        notes: updatedTicket.notes,
        createdAt: updatedTicket.createdAt,
        updatedAt: updatedTicket.updatedAt,
        completedAt: updatedTicket.completedAt,
        customer: {
          id: updatedTicket.order.customer.id,
          name: `${updatedTicket.order.customer.firstName || ''} ${updatedTicket.order.customer.lastName || ''}`.trim() || 'Client Anonyme',
          phone: updatedTicket.order.customer.phone
        },
        store: updatedTicket.store,
        orderTotal: updatedTicket.order.total
      }
    });

  } catch (error) {
    console.error('Error updating preparation ticket:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// DELETE - Supprimer un ticket de préparation
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { id } = await params;
    
    // Vérifier que le ticket appartient à l'utilisateur
    const existingTicket = await prisma.preparationTicket.findFirst({
      where: { 
        id,
        store: {
          business: { ownerId: decoded.userId }
        }
      }
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    // Supprimer le ticket
    await prisma.preparationTicket.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket supprimé avec succès' 
    });

  } catch (error) {
    console.error('Error deleting preparation ticket:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}