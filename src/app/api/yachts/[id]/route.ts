
// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht, YachtPackage } from '@/lib/types';
import { query } from '@/lib/db';

function buildYachtUpdateSetClause(data: Partial<Omit<Yacht, 'id' | 'packages'>> & { packages_json?: string }): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  // Allowed direct DB columns, packages_json is handled separately if present
  const allowedKeys: (keyof (Omit<Yacht, 'id' | 'packages'> & { packages_json?: string }))[] = [
    'name', 'imageUrl', 'capacity', 'status',
    'customPackageInfo', 'packages_json' // packages_json for the stringified array
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(0); 
      } else if (typeof value === 'string' && value.trim() === '' && (key === 'imageUrl' || key === 'customPackageInfo')) {
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
    const yachtDataDb: any[] = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    console.log(`[API GET /api/yachts/${id}] Raw DB Data:`, yachtDataDb.length > 0 ? yachtDataDb[0] : "No yacht found from DB");
    
    if (yachtDataDb.length > 0) {
      const dbYacht = yachtDataDb[0];
      let packages: YachtPackage[] = [];
      if (dbYacht.packages_json) {
        try {
          packages = JSON.parse(dbYacht.packages_json);
          if (!Array.isArray(packages)) packages = [];
        } catch (e) {
          console.error(`[API GET /api/yachts/${id}] Error parsing packages_json for yacht ${dbYacht.id}:`, e);
          packages = [];
        }
      }
      const yacht: Yacht = {
        id: dbYacht.id,
        name: dbYacht.name,
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: dbYacht.status || 'Available',
        packages: packages,
        customPackageInfo: dbYacht.customPackageInfo || undefined,
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
    const updatedYachtDataFromClient = await request.json() as Partial<Yacht>;
    console.log(`[API PUT /api/yachts/${id}] Received data:`, updatedYachtDataFromClient);

    const existingYachtResult: any = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    if (existingYachtResult.length === 0) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    // Prepare data for DB update, separating packages for JSON stringification
    const { packages, ...otherYachtData } = updatedYachtDataFromClient;
    const dataForUpdateClause: Partial<Omit<Yacht, 'id' | 'packages'>> & { packages_json?: string } = { ...otherYachtData };
    if (packages !== undefined) { // if packages array is part of update
        dataForUpdateClause.packages_json = JSON.stringify(packages || []); // Ensure it's an array even if null/undefined
    }


    const { clause, values } = buildYachtUpdateSetClause(dataForUpdateClause);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); 
    
    console.log(`[API PUT /api/yachts/${id}] Executing SQL: UPDATE yachts SET ${clause} WHERE id = ?`, 'with params:', values);
    const result: any = await query(`UPDATE yachts SET ${clause} WHERE id = ?`, values);
    console.log(`[API PUT /api/yachts/${id}] DB Update Result:`, result);
    
    if (result.affectedRows === 0) {
       return NextResponse.json({ message: 'Yacht not found during update or no changes made' }, { status: 404 });
    }
    
    // Fetch the updated yacht to return it with parsed packages
    const updatedYachtFromDbResult: any[] = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    if (updatedYachtFromDbResult.length > 0) {
      const dbYacht = updatedYachtFromDbResult[0];
      let finalPackages: YachtPackage[] = [];
      if (dbYacht.packages_json) {
        try {
          finalPackages = JSON.parse(dbYacht.packages_json);
          if (!Array.isArray(finalPackages)) finalPackages = [];
        } catch (e) { finalPackages = []; }
      }
      const finalUpdatedYacht: Yacht = {
        id: dbYacht.id,
        name: dbYacht.name,
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: dbYacht.status || 'Available',
        packages: finalPackages,
        customPackageInfo: dbYacht.customPackageInfo || undefined,
      };
      return NextResponse.json(finalUpdatedYacht, { status: 200 });
    }
    // Fallback if fetch after update fails
    return NextResponse.json({ message: 'Yacht updated, but failed to fetch confirmation with parsed packages.' }, { status: 200 });


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
