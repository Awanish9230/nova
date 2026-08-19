import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { TicketStatus } from '@prisma/client';

const statusSchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED']),
});

// Define allowed transitions
const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['ASSIGNED', 'ESCALATED'],
  ASSIGNED: ['IN_PROGRESS', 'OPEN', 'ESCALATED'], // Can go back to OPEN if unassigned
  IN_PROGRESS: ['RESOLVED', 'ASSIGNED', 'ESCALATED'], // Can go back to ASSIGNED if work paused
  ESCALATED: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
  RESOLVED: [], // Terminal state (in a real system maybe RE-OPEN, but keeping simple)
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { status: newStatus } = parsed.data;

    const ticket = await prisma.ticket.findUnique({ where: { id: (await params).id } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Role-based auth
    if (role === 'TECHNICIAN' && ticket.assignedTechnicianId !== userId) {
      return NextResponse.json({ error: 'Forbidden. You can only update your assigned tickets.' }, { status: 403 });
    }

    // Admins can transition anything, but technicians must follow strict logic? 
    // Spec says "enforce your own legal transition rules". We'll apply it to both.
    const validNextStates = allowedTransitions[ticket.status];
    if (!validNextStates.includes(newStatus as TicketStatus)) {
      return NextResponse.json({ 
        error: `Illegal state transition from ${ticket.status} to ${newStatus}` 
      }, { status: 409 });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: newStatus },
    });

    return NextResponse.json({ message: 'Ticket status updated', ticket: updatedTicket }, { status: 200 });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
