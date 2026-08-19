import { prisma } from '@/lib/db';
import { Priority, TicketStatus } from '@prisma/client';

/**
 * Service to handle escalation logic for tickets.
 */
export async function runEscalations() {
  const now = new Date();

  // Find all tickets that are past SLA, not resolved, and not already escalated
  const overdueTickets = await prisma.ticket.findMany({
    where: {
      slaDueAt: {
        lt: now,
      },
      status: {
        notIn: [TicketStatus.RESOLVED, TicketStatus.ESCALATED],
      },
    },
  });

  if (overdueTickets.length === 0) {
    return 0; // No escalations needed
  }

  let escalatedCount = 0;

  // Process escalations
  // In a real high-throughput system, this would be a raw SQL UPDATE or batch updates.
  for (const ticket of overdueTickets) {
    let newPriority = ticket.priority;
    
    // Escalate priority by one level
    if (ticket.priority === Priority.LOW) newPriority = Priority.MEDIUM;
    else if (ticket.priority === Priority.MEDIUM) newPriority = Priority.HIGH;
    else if (ticket.priority === Priority.HIGH) newPriority = Priority.CRITICAL;

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.ESCALATED,
        priority: newPriority,
        escalatedAt: new Date(),
      },
    });
    escalatedCount++;
  }

  return escalatedCount;
}

/**
 * Calculate SLA timestamp based on priority level.
 */
export function calculateSla(priority: Priority): Date {
  const now = new Date();
  switch (priority) {
    case Priority.CRITICAL:
      return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    case Priority.HIGH:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    case Priority.MEDIUM:
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    case Priority.LOW:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
