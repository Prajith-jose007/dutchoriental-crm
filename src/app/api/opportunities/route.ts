
// src/app/api/opportunities/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Opportunity } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

const ensureISOFormat = (dateSource?: string | Date): string | null => {
  if (!dateSource) return null;
  if (dateSource instanceof Date) {
    if (isValid(dateSource)) return formatISO(dateSource);
    return null;
  }
  try {
    const parsed = parseISO(dateSource);
    if (isValid(parsed)) return formatISO(parsed);
    return dateSource;
  } catch {
    return dateSource;
  }
};

export async function GET(request: NextRequest) {
  try {
    const oppsDataDb: any[] = await query('SELECT * FROM opportunities ORDER BY createdAt DESC');
    
    const opportunities: Opportunity[] = oppsDataDb.map(dbOpp => ({
      id: String(dbOpp.id),
      potentialCustomer: dbOpp.potentialCustomer,
      estimatedClosingDate: ensureISOFormat(dbOpp.estimatedClosingDate)!,
      ownerUserId: dbOpp.ownerUserId,
      yachtId: dbOpp.yachtId,
      productType: dbOpp.productType,
      pipelinePhase: dbOpp.pipelinePhase,
      priority: dbOpp.priority,
      estimatedRevenue: Number(dbOpp.estimatedRevenue),
      meanExpectedValue: Number(dbOpp.meanExpectedValue),
      currentStatus: dbOpp.currentStatus,
      followUpUpdates: dbOpp.followUpUpdates,
      createdAt: ensureISOFormat(dbOpp.createdAt)!,
      updatedAt: ensureISOFormat(dbOpp.updatedAt)!,
    }));

    return NextResponse.json(opportunities, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API GET /api/opportunities] Error fetching opportunities:', error);
    return NextResponse.json({ message: 'Failed to fetch opportunities', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newOppData = await request.json() as Opportunity;
    
    const { potentialCustomer, estimatedClosingDate, ownerUserId, yachtId, productType, pipelinePhase, priority, estimatedRevenue, currentStatus, createdAt, updatedAt } = newOppData;

    if (!potentialCustomer || !estimatedClosingDate || !ownerUserId || !yachtId || !productType || !pipelinePhase || !priority || estimatedRevenue === undefined || !currentStatus) {
        return NextResponse.json({ message: 'Missing required opportunity fields' }, { status: 400 });
    }
    
    const finalId = newOppData.id || `OPP-${Date.now()}`;

    const oppToStore = {
        ...newOppData,
        id: finalId,
        estimatedClosingDate: ensureISOFormat(estimatedClosingDate)!,
        createdAt: ensureISOFormat(createdAt)!,
        updatedAt: ensureISOFormat(updatedAt)!,
        meanExpectedValue: newOppData.meanExpectedValue ?? 0,
    };
    delete (oppToStore as Partial<Opportunity>).closingProbability;

    const sql = `
      INSERT INTO opportunities (
        id, potentialCustomer, estimatedClosingDate, ownerUserId, yachtId, productType, 
        pipelinePhase, priority, estimatedRevenue, meanExpectedValue, currentStatus, 
        followUpUpdates, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        oppToStore.id, oppToStore.potentialCustomer, oppToStore.estimatedClosingDate, oppToStore.ownerUserId,
        oppToStore.yachtId, oppToStore.productType, oppToStore.pipelinePhase, oppToStore.priority,
        oppToStore.estimatedRevenue, oppToStore.meanExpectedValue, oppToStore.currentStatus,
        oppToStore.followUpUpdates, oppToStore.createdAt, oppToStore.updatedAt
    ];
    
    const result: any = await query(sql, params);

    if (result.affectedRows === 1) {
       const createdOppDb: any[] = await query('SELECT * FROM opportunities WHERE id = ?', [finalId]);
       if (createdOppDb.length > 0) {
         const returnedOpp: Opportunity = {
           ...createdOppDb[0],
           estimatedClosingDate: ensureISOFormat(createdOppDb[0].estimatedClosingDate)!,
           createdAt: ensureISOFormat(createdOppDb[0].createdAt)!,
           updatedAt: ensureISOFormat(createdOppDb[0].updatedAt)!,
         }
         return NextResponse.json(returnedOpp, { status: 201 });
       }
    }
    throw new Error('Failed to insert opportunity into database');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API POST /api/opportunities] Error creating opportunity:', error);
    return NextResponse.json({ message: 'Failed to create opportunity', error: errorMessage }, { status: 500 });
  }
}
