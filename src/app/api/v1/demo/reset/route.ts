import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    await prisma.ticket.deleteMany({});
    // We only delete tickets, keeping devices and technicians intact so the user can continue testing.
    return NextResponse.json({ message: 'All tickets deleted successfully. Database is clean.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
