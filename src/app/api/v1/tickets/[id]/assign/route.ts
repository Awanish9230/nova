import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const assignSchema = z.object({
  technician_id: z.string().min(1),
});

const MAX_TECHNICIAN_CAPACITY = 5;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { technician_id } = parsed.data;

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({ where: { id: (await params).id } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verify the user is a technician
    const technician = await prisma.user.findUnique({ where: { id: technician_id } });
    if (!technician || technician.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Invalid technician ID' }, { status: 400 });
    }

    // Check Technician Capacity
    const activeTicketsCount = await prisma.ticket.count({
      where: {
        assignedTechnicianId: technician_id,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS'],
        },
      },
    });

    if (activeTicketsCount >= MAX_TECHNICIAN_CAPACITY) {
      return NextResponse.json({ 
        error: `Technician is at capacity (max ${MAX_TECHNICIAN_CAPACITY} active tickets).` 
      }, { status: 409 });
    }

    // Perform Assignment
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedTechnicianId: technician_id,
        status: ticket.status === 'OPEN' ? 'ASSIGNED' : ticket.status,
      },
    });

    return NextResponse.json({ message: 'Ticket assigned successfully', ticket: updatedTicket }, { status: 200 });
  } catch (error) {
    console.error('Assign ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
