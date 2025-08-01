
// src/app/api/opportunities/[id]/route.ts
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

function buildOpportunityUpdateSetClause(data: Partial<Omit<Opportunity, 'id' | 'closingProbability'>>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Omit<Opportunity, 'id' | 'closingProbability'>)[] = [
    'estimatedClosingDate', 'potentialCustomer', 'ownerUserId', 'yachtId', 'productType',
    'pipelinePhase', 'priority', 'estimatedRevenue', 'meanExpectedValue', 'currentStatus',
    'followUpUpdates', 'createdAt', 'updatedAt'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (key === 'estimatedClosingDate' || key === 'createdAt' || key === 'updatedAt') {
        valuesToUpdate.push(ensureISOFormat(value as string) || null);
      } else if (value === '' && ['followUpUpdates'].includes(key)) {
        valuesToUpdate.push(null);
      } else {
        valuesToUpdate.push(value);
      }
    }
  });
  return { clause: fieldsToUpdate.join(', '), values: valuesToUpdate };
}


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[API GET /api/opportunities/${id}] Received request`);
    const oppDataDb: any[] = await query('SELECT * FROM opportunities WHERE id = ?', [id]);
    
    if (oppDataDb.length > 0) {
      const dbOpp = oppDataDb[0];
      const opportunity: Opportunity = {
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
      };
      console.log(`[API GET /api/opportunities/${id}] Opportunity found:`, opportunity);
      return NextResponse.json(opportunity, { status: 200 });
    } else {
      console.log(`[API GET /api/opportunities/${id}] Opportunity not found.`);
      return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`[API GET /api/opportunities/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to fetch opportunity', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedOppData = await request.json() as Partial<Opportunity>;
    console.log(`[API PUT /api/opportunities/${id}] Received data:`, updatedOppData);

    const existingOppResult: any = await query('SELECT id FROM opportunities WHERE id = ?', [id]);
    if (existingOppResult.length === 0) {
      console.log(`[API PUT /api/opportunities/${id}] Opportunity not found for update.`);
      return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 });
    }

    const dataToUpdate = { ...updatedOppData };
    delete (dataToUpdate as Partial<Opportunity>).closingProbability; // Remove derived field before update
    
    const { clause, values } = buildOpportunityUpdateSetClause(dataToUpdate);
    if (clause.length === 0) {
      console.log(`[API PUT /api/opportunities/${id}] No valid fields to update.`);
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); 
    
    console.log(`[API PUT /api/opportunities/${id}] SQL: UPDATE opportunities SET ${clause} WHERE id = ?`, 'Params:', values);
    const result: any = await query(`UPDATE opportunities SET ${clause} WHERE id = ?`, values);
    console.log(`[API PUT /api/opportunities/${id}] DB Update Result:`, result);
    
    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/opportunities/${id}] Opportunity not found during update or no changes made.`);
    }
    
    const finalUpdatedOppQuery: any = await query('SELECT * FROM opportunities WHERE id = ?', [id]);
    if (finalUpdatedOppQuery.length > 0) {
       const dbOpp = finalUpdatedOppQuery[0];
       const finalOpp: Opportunity = {
          ...dbOpp,
          estimatedClosingDate: ensureISOFormat(dbOpp.estimatedClosingDate)!,
          createdAt: ensureISOFormat(dbOpp.createdAt)!,
          updatedAt: ensureISOFormat(dbOpp.updatedAt)!,
       };
       console.log(`[API PUT /api/opportunities/${id}] Successfully updated opportunity.`);
       return NextResponse.json(finalOpp, { status: 200 });
    }
    console.error(`[API PUT /api/opportunities/${id}] Opportunity updated, but failed to fetch confirmation.`);
    return NextResponse.json({ message: 'Opportunity updated, but failed to fetch confirmation.' }, { status: 200 });

  } catch (error) {
    console.error(`[API PUT /api/opportunities/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to update opportunity', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[API DELETE /api/opportunities/${id}] Attempting to delete opportunity.`);
    const result: any = await query('DELETE FROM opportunities WHERE id = ?', [id]);
    console.log(`[API DELETE /api/opportunities/${id}] DB Delete Result:`, result);
    
    if (result.affectedRows === 0) {
      console.warn(`[API DELETE /api/opportunities/${id}] Opportunity not found for deletion.`);
      return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 });
    }

    console.log(`[API DELETE /api/opportunities/${id}] Successfully deleted opportunity.`);
    return NextResponse.json({ message: 'Opportunity deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API DELETE /api/opportunities/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to delete opportunity', error: (error as Error).message }, { status: 500 });
  }
}
