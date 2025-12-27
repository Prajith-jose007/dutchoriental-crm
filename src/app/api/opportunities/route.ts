
// src/app/api/opportunities/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Opportunity } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

const ensureISOFormat = (dateSource?: string | Date): string | null => {
  if (!dateSource) return null;
  if (dateSource instanceof Date) {
    return isValid(dateSource) ? formatISO(dateSource) : null;
  }
  try {
    const parsed = parseISO(dateSource);
    return isValid(parsed) ? formatISO(parsed) : dateSource;
  } catch {
    return dateSource;
  }
};

export async function GET() {
  try {
    const oppsDataDb = await query<Opportunity[]>('SELECT * FROM opportunities ORDER BY createdAt DESC');

    const opportunities: Opportunity[] = oppsDataDb.map(dbOpp => ({
      ...dbOpp,
      estimatedRevenue: Number(dbOpp.estimatedRevenue || 0),
      meanExpectedValue: Number(dbOpp.meanExpectedValue || 0),
      estimatedClosingDate: ensureISOFormat(dbOpp.estimatedClosingDate)!,
      createdAt: ensureISOFormat(dbOpp.createdAt)!,
      updatedAt: ensureISOFormat(dbOpp.updatedAt)!,
    }));

    return NextResponse.json(opportunities, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API GET /api/opportunities] Error fetching opportunities:', error);
    return NextResponse.json({ message: `Failed to fetch opportunities: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newOppData = await request.json() as Opportunity;

    const { potentialCustomer, subject, estimatedClosingDate, ownerUserId, yachtId, productType, pipelinePhase, priority, estimatedRevenue, currentStatus } = newOppData;

    if (!potentialCustomer || !subject || !estimatedClosingDate || !ownerUserId || !yachtId || !productType || !pipelinePhase || !priority || estimatedRevenue === undefined || !currentStatus) {
      return NextResponse.json({ message: 'Missing required opportunity fields' }, { status: 400 });
    }

    const now = new Date();
    const finalId = newOppData.id || `OPP-${Date.now()}`;

    const oppToStore = {
      ...newOppData,
      id: finalId,
      estimatedClosingDate: ensureISOFormat(estimatedClosingDate)!,
      createdAt: ensureISOFormat(newOppData.createdAt) || formatISO(now),
      updatedAt: ensureISOFormat(newOppData.updatedAt) || formatISO(now),
      meanExpectedValue: newOppData.meanExpectedValue ?? 0,
    };
    delete (oppToStore as Partial<Opportunity>).closingProbability;

    const sql = `
      INSERT INTO opportunities (
        id, potentialCustomer, subject, estimatedClosingDate, ownerUserId, yachtId, productType, 
        pipelinePhase, priority, estimatedRevenue, meanExpectedValue, currentStatus, 
        followUpUpdates, createdAt, updatedAt, location, reportType, tripReportStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      oppToStore.id, oppToStore.potentialCustomer, oppToStore.subject, oppToStore.estimatedClosingDate, oppToStore.ownerUserId,
      oppToStore.yachtId, oppToStore.productType, oppToStore.pipelinePhase, oppToStore.priority,
      oppToStore.estimatedRevenue, oppToStore.meanExpectedValue, oppToStore.currentStatus,
      oppToStore.followUpUpdates, oppToStore.createdAt, oppToStore.updatedAt,
      oppToStore.location, oppToStore.reportType, oppToStore.tripReportStatus
    ];

    await query(sql, params);

    const createdOppDb = await query<any[]>('SELECT * FROM opportunities WHERE id = ?', [finalId]);
    if (createdOppDb.length > 0) {
      const returnedOpp: Opportunity = {
        ...createdOppDb[0],
        estimatedRevenue: Number(createdOppDb[0].estimatedRevenue || 0),
        meanExpectedValue: Number(createdOppDb[0].meanExpectedValue || 0),
        estimatedClosingDate: ensureISOFormat(createdOppDb[0].estimatedClosingDate)!,
        createdAt: ensureISOFormat(createdOppDb[0].createdAt)!,
        updatedAt: ensureISOFormat(createdOppDb[0].updatedAt)!,
      }
      return NextResponse.json(returnedOpp, { status: 201 });
    }

    throw new Error('Failed to insert opportunity into database or retrieve it after insertion.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API POST /api/opportunities] Error creating opportunity:', error);
    return NextResponse.json({ message: `Failed to create opportunity: ${errorMessage}` }, { status: 500 });
  }
}
