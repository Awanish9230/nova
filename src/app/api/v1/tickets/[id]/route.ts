import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runEscalations } from '@/services/escalation.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Lazy check-on-read for escalations
    await runEscalations();

    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    const ticket = await prisma.ticket.findUnique({
      where: { id: (await params).id },
      include: { device: true, assignedTechnician: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (role === 'TECHNICIAN' && ticket.assignedTechnicianId !== userId) {
      return NextResponse.json({ error: 'Forbidden. Ticket belongs to another technician.' }, { status: 403 });
    }

    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    console.error('Ticket fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
