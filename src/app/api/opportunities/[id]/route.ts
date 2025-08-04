
// src/app/api/opportunities/[id]/route.ts
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
  const id = params.id;
  if (!id) {
    return NextResponse.json({ message: 'Opportunity ID is required' }, { status: 400 });
  }

  try {
    const oppDataDb: any[] = await query('SELECT * FROM opportunities WHERE id = ?', [id]);
    
    if (oppDataDb.length > 0) {
      const dbOpp = oppDataDb[0];
      const opportunity: Opportunity = {
        ...dbOpp,
        estimatedRevenue: Number(dbOpp.estimatedRevenue || 0),
        meanExpectedValue: Number(dbOpp.meanExpectedValue || 0),
        estimatedClosingDate: ensureISOFormat(dbOpp.estimatedClosingDate)!,
        createdAt: ensureISOFormat(dbOpp.createdAt)!,
        updatedAt: ensureISOFormat(dbOpp.updatedAt)!,
      };
      return NextResponse.json(opportunity, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API GET /api/opportunities/${id}] Error:`, error);
    return NextResponse.json({ message: `Failed to fetch opportunity: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ message: 'Opportunity ID is required for update' }, { status: 400 });
  }

  try {
    const updatedOppData = await request.json() as Partial<Opportunity>;

    const existingOppResult: any = await query('SELECT id FROM opportunities WHERE id = ?', [id]);
    if (existingOppResult.length === 0) {
      return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 });
    }

    const dataToUpdate = { ...updatedOppData, updatedAt: formatISO(new Date()) };
    delete (dataToUpdate as Partial<Opportunity>).closingProbability;
    
    const { clause, values } = buildOpportunityUpdateSetClause(dataToUpdate);
    if (clause.length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); 
    
    await query(`UPDATE opportunities SET ${clause} WHERE id = ?`, values);
    
    const finalUpdatedOppQuery: any = await query('SELECT * FROM opportunities WHERE id = ?', [id]);
    if (finalUpdatedOppQuery.length > 0) {
       const dbOpp = finalUpdatedOppQuery[0];
       const finalOpp: Opportunity = {
          ...dbOpp,
          estimatedRevenue: Number(dbOpp.estimatedRevenue || 0),
          meanExpectedValue: Number(dbOpp.meanExpectedValue || 0),
          estimatedClosingDate: ensureISOFormat(dbOpp.estimatedClosingDate)!,
          createdAt: ensureISOFormat(dbOpp.createdAt)!,
          updatedAt: ensureISOFormat(dbOpp.updatedAt)!,
       };
       return NextResponse.json(finalOpp, { status: 200 });
    }
    return NextResponse.json({ message: 'Opportunity updated, but failed to fetch confirmation.' }, { status: 500 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API PUT /api/opportunities/${id}] Error:`, error);
    return NextResponse.json({ message: `Failed to update opportunity: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ message: 'Opportunity ID is required for deletion' }, { status: 400 });
  }

  try {
    const result: any = await query('DELETE FROM opportunities WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Opportunity deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API DELETE /api/opportunities/${id}] Error:`, error);
    return NextResponse.json({ message: `Failed to delete opportunity: ${errorMessage}` }, { status: 500 });
  }
}
