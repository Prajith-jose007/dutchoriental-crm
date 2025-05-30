
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
    'otherCharges' // This will be stringified
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      if (key === 'otherCharges') {
        fieldsToUpdate.push(`other_charges_json = ?`); // DB column name
        valuesToUpdate.push(Array.isArray(value) ? JSON.stringify(value) : null);
      } else {
        fieldsToUpdate.push(`${key} = ?`);
        if (['capacity', 'childRate', 'adultStandardRate', 'adultStandardDrinksRate', 'vipChildRate', 'vipAdultRate', 'vipAdultDrinksRate', 'royalChildRate', 'royalAdultRate', 'royalDrinksRate'].includes(key)) {
          valuesToUpdate.push(Number(value || 0));
        } else if (value === '' && ['imageUrl', 'customPackageInfo'].includes(key)) {
           valuesToUpdate.push(null);
        }
        else {
          valuesToUpdate.push(value);
        }
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
    const yachtDataDb: any[] = await query(
      `SELECT id, name, imageUrl, capacity, status, customPackageInfo,
              childRate, adultStandardRate, adultStandardDrinksRate,
              vipChildRate, vipAdultRate, vipAdultDrinksRate,
              royalChildRate, royalAdultRate, royalDrinksRate,
              other_charges_json
       FROM yachts WHERE id = ?`, [id] // Updated to other_charges_json
    );
    console.log(`[API GET /api/yachts/${id}] Raw DB Data:`, yachtDataDb.length > 0 ? yachtDataDb[0] : "No yacht found from DB");

    if (yachtDataDb.length > 0) {
      const dbYacht = yachtDataDb[0];
      let parsedOtherCharges = [];
      if (dbYacht.other_charges_json) {
        try {
          parsedOtherCharges = JSON.parse(dbYacht.other_charges_json);
           if (!Array.isArray(parsedOtherCharges)) {
            parsedOtherCharges = [];
          }
        } catch (e) {
          console.warn(`[API GET /api/yachts/${id}] Failed to parse other_charges_json:`, e);
          parsedOtherCharges = [];
        }
      }
      const yacht: Yacht = {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || ''),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        customPackageInfo: dbYacht.customPackageInfo || undefined,
        childRate: Number(dbYacht.childRate || 0),
        adultStandardRate: Number(dbYacht.adultStandardRate || 0),
        adultStandardDrinksRate: Number(dbYacht.adultStandardDrinksRate || 0),
        vipChildRate: Number(dbYacht.vipChildRate || 0),
        vipAdultRate: Number(dbYacht.vipAdultRate || 0),
        vipAdultDrinksRate: Number(dbYacht.vipAdultDrinksRate || 0),
        royalChildRate: Number(dbYacht.royalChildRate || 0),
        royalAdultRate: Number(dbYacht.royalAdultRate || 0),
        royalDrinksRate: Number(dbYacht.royalDrinksRate || 0),
        otherCharges: parsedOtherCharges,
      };
      console.log(`[API GET /api/yachts/${id}] Mapped Yacht Data:`, yacht);
      return NextResponse.json(yacht, { status: 200 });
    } else {
      console.log(`[API GET /api/yachts/${id}] Yacht not found.`);
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
    const updatedYachtDataFromClient = await request.json() as Partial<Yacht>;
    console.log(`[API PUT /api/yachts/${id}] Received data:`, updatedYachtDataFromClient);

    const existingYachtResult: any[] = await query('SELECT id FROM yachts WHERE id = ?', [id]);
    if (existingYachtResult.length === 0) {
      console.log(`[API PUT /api/yachts/${id}] Yacht not found for update.`);
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    const { clause, values } = buildYachtUpdateSetClause(updatedYachtDataFromClient);

    if (clause.length === 0) {
       console.log(`[API PUT /api/yachts/${id}] No valid fields to update.`);
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); // For the WHERE clause

    console.log(`[API PUT /api/yachts/${id}] Executing SQL: UPDATE yachts SET ${clause} WHERE id = ?`, 'with params:', values);
    const result: any = await query(`UPDATE yachts SET ${clause} WHERE id = ?`, values);
    console.log(`[API PUT /api/yachts/${id}] DB Update Result:`, result);

    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/yachts/${id}] Yacht not found during update or no changes made to the row.`);
    }

    const finalUpdatedYachtQuery: any[] = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    if (finalUpdatedYachtQuery.length > 0) {
       const dbYacht = finalUpdatedYachtQuery[0];
       let parsedOtherCharges = [];
        if (dbYacht.other_charges_json) {
            try {
                parsedOtherCharges = JSON.parse(dbYacht.other_charges_json);
            } catch (e) { /* ignore */ }
        }
       const finalYacht: Yacht = {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || ''),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        customPackageInfo: dbYacht.customPackageInfo || undefined,
        childRate: Number(dbYacht.childRate || 0),
        adultStandardRate: Number(dbYacht.adultStandardRate || 0),
        adultStandardDrinksRate: Number(dbYacht.adultStandardDrinksRate || 0),
        vipChildRate: Number(dbYacht.vipChildRate || 0),
        vipAdultRate: Number(dbYacht.vipAdultRate || 0),
        vipAdultDrinksRate: Number(dbYacht.vipAdultDrinksRate || 0),
        royalChildRate: Number(dbYacht.royalChildRate || 0),
        royalAdultRate: Number(dbYacht.royalAdultRate || 0),
        royalDrinksRate: Number(dbYacht.royalDrinksRate || 0),
        otherCharges: parsedOtherCharges,
       };
       console.log(`[API PUT /api/yachts/${id}] Successfully updated yacht.`);
       return NextResponse.json(finalYacht, { status: 200 });
    }
    console.error(`[API PUT /api/yachts/${id}] Yacht updated, but failed to fetch confirmation.`);
    return NextResponse.json({ message: 'Yacht updated, but failed to fetch confirmation.' }, { status: 200 });

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
    // TODO: Check for related leads before deleting a yacht?
    const result: any = await query('DELETE FROM yachts WHERE id = ?', [id]);
    console.log(`[API DELETE /api/yachts/${id}] DB Delete Result:`, result);

    if (result.affectedRows === 0) {
      console.warn(`[API DELETE /api/yachts/${id}] Yacht not found for deletion.`);
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    console.log(`[API DELETE /api/yachts/${id}] Successfully deleted yacht.`);
    return NextResponse.json({ message: 'Yacht deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API DELETE /api/yachts/${id}] Failed to delete yacht:`, error);
    return NextResponse.json({ message: 'Failed to delete yacht', error: (error as Error).message }, { status: 500 });
  }
}
