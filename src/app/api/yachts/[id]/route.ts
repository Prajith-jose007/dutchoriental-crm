
// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht, YachtPackageItem } from '@/lib/types';
import { query } from '@/lib/db';

// Helper function to build the SET clause for UPDATE queries
function buildYachtUpdateSetClause(data: Partial<Omit<Yacht, 'id'>>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Omit<Yacht, 'id'>)[] = [
    'name', 'imageUrl', 'capacity', 'status', 'category', 'packages', 'customPackageInfo'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      if (key === 'packages') {
        fieldsToUpdate.push(`packages_json = ?`);
        valuesToUpdate.push(value && Array.isArray(value) ? JSON.stringify(value) : null);
      } else {
        fieldsToUpdate.push(`${key} = ?`);
        if (key === 'capacity') {
          valuesToUpdate.push(Number(value || 0));
        } else if (value === '' && ['imageUrl', 'customPackageInfo'].includes(key)) {
           valuesToUpdate.push(null);
        } else {
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
    const sql = `SELECT * FROM yachts WHERE id = ?`;
    console.log(`[API GET /api/yachts/${id}] Executing SQL:`, sql.trim(), 'with ID:', id);
    const yachtDataDb: any[] = await query(sql, [id]);
    console.log(`[API GET /api/yachts/${id}] Raw DB Data:`, yachtDataDb.length > 0 ? yachtDataDb[0] : "No yacht found from DB");

    if (yachtDataDb.length > 0) {
      const dbYacht = yachtDataDb[0];
      let packages: YachtPackageItem[] = [];
      if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
        try {
          const parsedPackages = JSON.parse(dbYacht.packages_json);
          if (Array.isArray(parsedPackages)) {
            packages = parsedPackages.map((pkg: any, index: number) => ({
              id: String(pkg.id || `db-pkg-${dbYacht.id}-${index}`),
              name: String(pkg.name || 'Unnamed Package'),
              rate: Number(pkg.rate || 0),
            }));
          } else {
            console.warn(`[API GET /api/yachts/${id}] Parsed packages_json for yacht ${dbYacht.id} is not an array.`);
          }
        } catch (e) {
          console.warn(`[API GET /api/yachts/${id}] Failed to parse packages_json for yacht ${dbYacht.id}. Error:`, (e as Error).message);
        }
      }

      const yacht: Yacht = {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || ''),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        category: (dbYacht.category || 'Private Cruise') as Yacht['category'],
        packages: packages,
        customPackageInfo: dbYacht.customPackageInfo || undefined,
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

    const sql = `UPDATE yachts SET ${clause} WHERE id = ?`;
    console.log(`[API PUT /api/yachts/${id}] Executing SQL:`, sql, 'with params:', values);
    const result: any = await query(sql, values);
    console.log(`[API PUT /api/yachts/${id}] DB Update Result:`, result);

    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/yachts/${id}] Yacht not found during update or no changes made to the row.`);
    }

    const finalUpdatedYachtQuery: any[] = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    if (finalUpdatedYachtQuery.length > 0) {
       const dbYacht = finalUpdatedYachtQuery[0];
        let packages: YachtPackageItem[] = [];
        if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
            try {
                const parsedPackages = JSON.parse(dbYacht.packages_json);
                if (Array.isArray(parsedPackages)) {
                    packages = parsedPackages.map((pkg: any, index: number) => ({
                        id: String(pkg.id || `db-pkg-${dbYacht.id}-${index}`),
                        name: String(pkg.name || 'Unnamed Package'),
                        rate: Number(pkg.rate || 0),
                    }));
                }
            } catch (e) {
                console.warn(`[API PUT /api/yachts/${id}] Failed to parse packages_json for updated yacht ${dbYacht.id}.`);
            }
        }
       const finalYacht: Yacht = {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || ''),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        category: (dbYacht.category || 'Private Cruise') as Yacht['category'],
        packages: packages,
        customPackageInfo: dbYacht.customPackageInfo || undefined,
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
    const sql = 'DELETE FROM yachts WHERE id = ?';
    console.log(`[API DELETE /api/yachts/${id}] Executing SQL:`, sql, 'with ID:', id);
    const result: any = await query(sql, [id]);
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
