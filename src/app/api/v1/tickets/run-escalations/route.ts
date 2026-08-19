import { NextResponse } from 'next/server';
import { runEscalations } from '@/services/escalation.service';

export async function POST(req: Request) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const count = await runEscalations();

    return NextResponse.json({ message: `Escalation check completed. Escalated ${count} tickets.` }, { status: 200 });
  } catch (error) {
    console.error('Run escalations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
