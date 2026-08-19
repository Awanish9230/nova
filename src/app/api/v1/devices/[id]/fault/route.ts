import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { fetchWeatherRisk } from '@/services/weather.service';
import { calculateSla } from '@/services/escalation.service';

const faultSchema = z.object({
  description: z.string().min(1),
  priority_hint: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const device = await prisma.device.findUnique({ where: { id: (await params).id } });
    
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = faultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { description, priority_hint } = parsed.data;
    const priority = priority_hint || 'MEDIUM';

    // External API Integration: Fetch weather risk based on device site_location
    const weatherRiskFlag = await fetchWeatherRisk(device.siteLocation);

    const slaDueAt = calculateSla(priority);

    const ticket = await prisma.ticket.create({
      data: {
        deviceId: device.id,
        description,
        priority,
        weatherRiskFlag,
        slaDueAt,
        status: 'OPEN',
      },
    });

    return NextResponse.json({
      message: 'Fault reported and ticket created',
      ticket,
    }, { status: 201 });
  } catch (error) {
    console.error('Fault report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
