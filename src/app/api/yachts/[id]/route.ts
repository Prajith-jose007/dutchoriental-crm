
// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { query } from '@/lib/db';

function buildYachtUpdateSetClause(data: Partial<Yacht>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Yacht)[] = [
    'name', 'imageUrl', 'capacity', 'status',
    'childRate', 'adultStandardRate', 'adultStandardDrinksRate',
    'vipChildRate', 'vipAdultRate', 'vipAdultDrinksRate',
    'royalChildRate', 'royalAdultRate', 'royalDrinksRate',
    'otherChargeName', 'otherChargeRate', 'customPackageInfo'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as keyof Yacht) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(0); // Default NaN numbers to 0
      } else if (typeof value === 'string' && value.trim() === '' && (key === 'imageUrl' || key === 'otherChargeName' || key === 'customPackageInfo')) {
         valuesToUpdate.push(null); // Allow setting optional text fields to NULL
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
    const yachtDataDb: any = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    
    if (yachtDataDb.length > 0) {
      const dbYacht = yachtDataDb[0];
      const yacht: Yacht = {
        ...dbYacht,
        capacity: Number(dbYacht.capacity),
        childRate: parseFloat(dbYacht.childRate || 0),
        adultStandardRate: parseFloat(dbYacht.adultStandardRate || 0),
        // ... (ensure all numeric fields are correctly parsed)
      };
      return NextResponse.json(yacht, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch yacht ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch yacht', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedYachtData = await request.json() as Partial<Omit<Yacht, 'id'>>;

    const existingYachtResult: any = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    if (existingYachtResult.length === 0) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    const { clause, values } = buildYachtUpdateSetClause(updatedYachtData);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); // For the WHERE clause
    
    const result: any = await query(`UPDATE yachts SET ${clause} WHERE id = ?`, values);
    
    if (result.affectedRows === 0) {
       return NextResponse.json({ message: 'Yacht not found during update or no changes made' }, { status: 404 });
    }
    
    const updatedYachtFromDb: any = await query('SELECT * FROM yachts WHERE id = ?', [id]);
     const finalUpdatedYacht: Yacht = {
        ...updatedYachtFromDb[0],
        capacity: Number(updatedYachtFromDb[0].capacity),
        // ... (ensure all numeric fields are correctly parsed)
      };
    return NextResponse.json(finalUpdatedYacht, { status: 200 });

  } catch (error) {
    console.error(`Failed to update yacht ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update yacht', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const result: any = await query('DELETE FROM yachts WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Yacht deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete yacht ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete yacht', error: (error as Error).message }, { status: 500 });
  }
}
