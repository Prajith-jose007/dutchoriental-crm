
import { NextResponse, type NextRequest } from 'next/server';
import { query } from '@/lib/db';
import type { Lead } from '@/lib/types';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: agentId } = await params;
    if (!agentId) {
        return NextResponse.json({ message: 'Agent ID is required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { amount, userId } = body;
        let remainingAmount = Number(amount);

        if (isNaN(remainingAmount) || remainingAmount <= 0) {
            return NextResponse.json({ message: 'Valid positive amount is required' }, { status: 400 });
        }

        // 1. Fetch unpaid/partially paid bookings for this agent
        // Statuses: 'Confirmed', 'Balance', 'Closed (Won)' (Revenue generating)
        // Ordered by Booking Date (month) ASC to pay oldest first
        const sql = `
      SELECT * FROM leads 
      WHERE agent = ? 
      AND status IN ('Confirmed', 'Balance', 'Closed (Won)', 'Completed')
      AND (netAmount - paidAmount) > 0.01
      ORDER BY month ASC
    `;

        // Note: 'Balance' status essentially means 'Confirmed' but waiting payment in some workflows?
        // We target anything that owes money.

        const leads = (await query<Lead[]>(sql, [agentId]));

        if (leads.length === 0) {
            return NextResponse.json({
                message: 'No outstanding bookings found for this agent.',
                allocated: 0
            }, { status: 200 });
        }

        let totalAllocated = 0;
        const updates = [];

        for (const lead of leads) {
            if (remainingAmount <= 0.001) break;

            const currentPaid = Number(lead.paidAmount || 0);
            const net = Number(lead.netAmount || 0);
            const outstanding = net - currentPaid;

            if (outstanding <= 0.01) continue;

            const toPay = Math.min(outstanding, remainingAmount);

            const newPaid = currentPaid + toPay;
            const newBalance = net - newPaid;

            // Update Query
            // We will execute these sequentially or in batch.
            // For safety, sequential await here (loop isn't massive usually).

            const updateSql = `
        UPDATE leads 
        SET paidAmount = ?, balanceAmount = ?, lastModifiedByUserId = ?, updatedAt = NOW()
        WHERE id = ?
      `;

            await query(updateSql, [newPaid, newBalance, userId || null, lead.id]);

            remainingAmount -= toPay;
            totalAllocated += toPay;
            updates.push({ leadId: lead.id, paid: toPay, newBalance });
        }

        // Note: If remainingAmount > 0, it means we overpaid? 
        // We could credit the Agent? (Requires Agent Wallet).
        // For now, we just allocate what we can.

        return NextResponse.json({
            message: 'Payment allocated successfully',
            allocated: totalAllocated,
            remaining_unallocated: remainingAmount,
            updates_count: updates.length
        }, { status: 200 });

    } catch (error) {
        console.error(`[API POST /api/agents/${agentId}/allocate-payment] Error:`, error);
        return NextResponse.json({ message: `Failed to allocate payment: ${(error as Error).message}` }, { status: 500 });
    }
}
