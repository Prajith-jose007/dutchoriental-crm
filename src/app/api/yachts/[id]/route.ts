
// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht, YachtPackage } from '@/lib/types';
import { query } from '@/lib/db';

// Helper function to build the SET clause for UPDATE queries
function buildYachtUpdateSetClause(data: Partial<Omit<Yacht, 'id' | 'packages'>> & { packages_json?: string }): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof (Omit<Yacht, 'id' | 'packages'> & { packages_json?: string }))[] = [
    'name', 'imageUrl', 'capacity', 'status',
    'customPackageInfo', 'packages_json' 
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (typeof value === 'number' && isNaN(value)) { // Should not happen with proper client-side validation
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
           if (!Array.isArray(packages)) {
            console.warn(`[API GET /api/yachts/${id}] packages_json did not parse to an array, defaulting to empty. Value:`, dbYacht.packages_json);
            packages = [];
          }
        } catch (e) {
          console.error(`[API GET /api/yachts/${id}] Error parsing packages_json for yacht ${dbYacht.id}:`, e, "Value:", dbYacht.packages_json);
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
      console.log(`[API GET /api/yachts/${id}] Mapped Yacht Data with parsed packages:`, yacht);
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
    // Expect the full Yacht object from the client, including the packages array
    const updatedYachtDataFromClient = await request.json() as Yacht; 
    console.log(`[API PUT /api/yachts/${id}] Received data:`, updatedYachtDataFromClient);

    const existingYachtResult: any = await query('SELECT id FROM yachts WHERE id = ?', [id]);
    if (existingYachtResult.length === 0) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    // Prepare data for DB update, separating packages for JSON stringification
    const { packages, ...otherYachtData } = updatedYachtDataFromClient;
    const dataForUpdateClause: Partial<Omit<Yacht, 'id' | 'packages'>> & { packages_json?: string } = { ...otherYachtData };
    
    // Always stringify packages, even if empty, to ensure the column is updated consistently
    dataForUpdateClause.packages_json = Array.isArray(packages) ? JSON.stringify(packages) : JSON.stringify([]);

    const { clause, values } = buildYachtUpdateSetClause(dataForUpdateClause);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); 
    
    console.log(`[API PUT /api/yachts/${id}] Executing SQL: UPDATE yachts SET ${clause} WHERE id = ?`, 'with params:', values);
    const result: any = await query(`UPDATE yachts SET ${clause} WHERE id = ?`, values);
    console.log(`[API PUT /api/yachts/${id}] DB Update Result:`, result);
    
    if (result.affectedRows === 0) {
       // This could also mean no actual changes were made to the row if data was identical
       console.warn(`[API PUT /api/yachts/${id}] Yacht not found during update or no changes made to the row.`);
    }
    
    // Return the data as it was received and processed for the update, which includes parsed packages
    const finalUpdatedYacht: Yacht = {
        ...updatedYachtDataFromClient, // This already has packages parsed
        // Ensure defaults for any potentially missing optional fields if not sent by client
        status: updatedYachtDataFromClient.status || 'Available',
        imageUrl: updatedYachtDataFromClient.imageUrl || undefined,
        customPackageInfo: updatedYachtDataFromClient.customPackageInfo || undefined,
    };
    return NextResponse.json(finalUpdatedYacht, { status: 200 });

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
