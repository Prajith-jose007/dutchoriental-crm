
// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { query } from '@/lib/db';

// Helper function to build the SET clause for UPDATE queries
function buildYachtUpdateSetClause(data: Partial<Omit<Yacht, 'id'>>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Omit<Yacht, 'id'>)[] = [
    'name', 'imageUrl', 'capacity', 'status', 'customPackageInfo',
    'childRate', 'adultStandardRate', 'adultStandardDrinksRate',
    'vipChildRate', 'vipAdultRate', 'vipAdultDrinksRate',
    'royalChildRate', 'royalAdultRate', 'royalDrinksRate',
    'otherChargeName', 'otherChargeRate'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(0);
      } else if (typeof value === 'string' && value.trim() === '' && (key === 'imageUrl' || key === 'customPackageInfo' || key === 'otherChargeName')) {
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
  console.log(`[API GET /api/yachts/${id}] Received request`);
  try {
    // TODO: Replace with actual database query
    // const yachtDataDb: any[] = await query('SELECT * FROM yachts WHERE id = ?', [id]);
     const yachtDataDb: any[] = await query(
      `SELECT id, name, imageUrl, capacity, status, customPackageInfo, 
              childRate, adultStandardRate, adultStandardDrinksRate, 
              vipChildRate, vipAdultRate, vipAdultDrinksRate, 
              royalChildRate, royalAdultRate, royalDrinksRate, 
              otherChargeName, otherChargeRate 
       FROM yachts WHERE id = ?`, [id]
    );
    console.log(`[API GET /api/yachts/${id}] Raw DB Data:`, yachtDataDb.length > 0 ? yachtDataDb[0] : "No yacht found from DB");

    if (yachtDataDb.length > 0) {
      const dbYacht = yachtDataDb[0];
      const yacht: Yacht = {
        id: dbYacht.id,
        name: dbYacht.name,
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: dbYacht.status || 'Available',
        customPackageInfo: dbYacht.customPackageInfo || undefined,
        childRate: parseFloat(dbYacht.childRate || 0),
        adultStandardRate: parseFloat(dbYacht.adultStandardRate || 0),
        adultStandardDrinksRate: parseFloat(dbYacht.adultStandardDrinksRate || 0),
        vipChildRate: parseFloat(dbYacht.vipChildRate || 0),
        vipAdultRate: parseFloat(dbYacht.vipAdultRate || 0),
        vipAdultDrinksRate: parseFloat(dbYacht.vipAdultDrinksRate || 0),
        royalChildRate: parseFloat(dbYacht.royalChildRate || 0),
        royalAdultRate: parseFloat(dbYacht.royalAdultRate || 0),
        royalDrinksRate: parseFloat(dbYacht.royalDrinksRate || 0),
        otherChargeName: dbYacht.otherChargeName || undefined,
        otherChargeRate: parseFloat(dbYacht.otherChargeRate || 0),
      };
      console.log(`[API GET /api/yachts/${id}] Mapped Yacht Data:`, yacht);
      return NextResponse.json(yacht, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`[API GET /api/yachts/${id}] Failed to fetch yacht:`, error);
    return NextResponse.json({ message: 'Failed to fetch yacht', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  console.log(`[API PUT /api/yachts/${id}] Received request`);
  try {
    const updatedYachtDataFromClient = await request.json() as Partial<Omit<Yacht, 'id'>>;
    console.log(`[API PUT /api/yachts/${id}] Received data:`, updatedYachtDataFromClient);

    // TODO: Check if yacht exists before updating
    // const existingYachtResult: any = await query('SELECT id FROM yachts WHERE id = ?', [id]);
    // if (existingYachtResult.length === 0) {
    //   return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    // }

    const dataForUpdateClause: Partial<Omit<Yacht, 'id'>> = { ...updatedYachtDataFromClient };

    const { clause, values } = buildYachtUpdateSetClause(dataForUpdateClause);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id);

    console.log(`[API PUT /api/yachts/${id}] Executing SQL: UPDATE yachts SET ${clause} WHERE id = ?`, 'with params:', values);
    // TODO: Replace with actual database query
    const result: any = await query(`UPDATE yachts SET ${clause} WHERE id = ?`, values);
    console.log(`[API PUT /api/yachts/${id}] DB Update Result:`, result);

    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/yachts/${id}] Yacht not found during update or no changes made to the row.`);
    }

    // Fetch the updated yacht to return it
    // TODO: Replace with actual database query
    // const finalUpdatedYachtData: any[] = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    // if (finalUpdatedYachtData.length > 0) {
    //    const dbYacht = finalUpdatedYachtData[0];
    //    const finalYacht: Yacht = { /* map dbYacht to Yacht type */};
    //    return NextResponse.json(finalYacht, { status: 200 });
    // }
    const finalYacht: Yacht = { id, ...updatedYachtDataFromClient } as Yacht; // Construct from input for now
     // Ensure all fields are present even if not updated
    Object.keys(finalYacht).forEach(key => {
        if (finalYacht[key as keyof Yacht] === undefined) {
            if (typeof (newYachtDataFromClient[key as keyof Yacht]) === 'number') {
                (finalYacht[key as keyof Yacht] as any) = 0;
            }
        }
    });
    return NextResponse.json(finalYacht, { status: 200 });


  } catch (error) {
    console.error(`[API PUT /api/yachts/${id}] Failed to update yacht:`, error);
    return NextResponse.json({ message: 'Failed to update yacht', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  console.log(`[API DELETE /api/yachts/${id}] Received request`);
  try {
    // TODO: Replace with actual database query
    const result: any = await query('DELETE FROM yachts WHERE id = ?', [id]);
    console.log(`[API DELETE /api/yachts/${id}] DB Delete Result:`, result);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Yacht deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API DELETE /api/yachts/${id}] Failed to delete yacht:`, error);
    return NextResponse.json({ message: 'Failed to delete yacht', error: (error as Error).message }, { status: 500 });
  }
}
