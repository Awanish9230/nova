import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runEscalations } from '@/services/escalation.service';

export async function GET(req: Request) {
  try {
    // Lazy check-on-read for escalations
    await runEscalations();

    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTechnicianId = searchParams.get('technicianId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (role === 'TECHNICIAN') {
      // Technicians can only see their own assigned tickets
      where.assignedTechnicianId = userId;
    } else if (role === 'ADMIN' && assignedTechnicianId) {
      where.assignedTechnicianId = assignedTechnicianId;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Ticket list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
