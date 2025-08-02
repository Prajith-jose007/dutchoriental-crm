
// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht, YachtPackageItem } from '@/lib/types';
import { query } from '@/lib/db';

function buildYachtUpdateSetClause(data: Partial<Omit<Yacht, 'id' | 'packages'>> & { packages_json?: string | null }): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Omit<Yacht, 'id' | 'packages'> | 'packages_json')[] = [
    'name', 'imageUrl', 'capacity', 'status', 'category', 'packages_json', 'customPackageInfo'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (key === 'capacity') {
        valuesToUpdate.push(Number(value || 0));
      } else if (value === '' && ['imageUrl', 'customPackageInfo'].includes(key)) {
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
  try {
    const sql = `SELECT id, name, imageUrl, capacity, status, category, customPackageInfo, packages_json FROM yachts WHERE id = ?`;
    const yachtDataDb: any[] = await query(sql, [id]);
    
    if (yachtDataDb.length > 0) {
      const dbYacht = yachtDataDb[0];
      let packages: YachtPackageItem[] = [];
      if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
        try {
          const parsedPackages = JSON.parse(dbYacht.packages_json);
          if (Array.isArray(parsedPackages)) {
            packages = parsedPackages.map((pkg: any, index: number) => ({
              id: String(pkg.id || `pkg-${dbYacht.id}-${index}`),
              name: String(pkg.name || 'Unnamed Package'),
              rate: Number(pkg.rate || 0),
            }));
          }
        } catch (e) {
          console.warn(`[API GET /api/yachts/${id}] Failed to parse packages_json for yacht ${dbYacht.id}.`);
        }
      }

      const yacht: Yacht = {
        id: String(dbYacht.id || ''), name: String(dbYacht.name || ''), imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0), status: (dbYacht.status || 'Available') as Yacht['status'],
        category: (dbYacht.category || 'Private Cruise') as Yacht['category'],
        packages: packages, customPackageInfo: dbYacht.customPackageInfo || undefined,
      };
      return NextResponse.json(yacht, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API GET /api/yachts/${id}] Failed to fetch yacht:`, error);
    return NextResponse.json({ message: 'Failed to fetch yacht', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const updatedYachtDataFromClient = await request.json() as Partial<Yacht>;

    const existingYachtResult: any[] = await query('SELECT id FROM yachts WHERE id = ?', [id]);
    if (existingYachtResult.length === 0) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    const dataToUpdate: Partial<Omit<Yacht, 'id' | 'packages'>> & { packages_json?: string | null } = {
      ...updatedYachtDataFromClient,
    };
    delete (dataToUpdate as any).id;
    
    if (updatedYachtDataFromClient.packages) {
      dataToUpdate.packages_json = JSON.stringify(
        updatedYachtDataFromClient.packages.map(p => ({ id: p.id, name: p.name, rate: Number(p.rate || 0) }))
      );
      delete (dataToUpdate as any).packages;
    } else if (updatedYachtDataFromClient.packages === null || updatedYachtDataFromClient.packages === undefined) {
      dataToUpdate.packages_json = null;
      delete (dataToUpdate as any).packages;
    }

    const { clause, values } = buildYachtUpdateSetClause(dataToUpdate);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id);

    const result: any = await query(`UPDATE yachts SET ${clause} WHERE id = ?`, values);
    
    const finalUpdatedYachtQuery: any[] = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    if (finalUpdatedYachtQuery.length > 0) {
       const dbYacht = finalUpdatedYachtQuery[0];
        let packages: YachtPackageItem[] = [];
        if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
            try {
                packages = JSON.parse(dbYacht.packages_json);
            } catch (e) {
                console.warn(`[API PUT /api/yachts/${id}] Failed to parse packages_json for updated yacht ${dbYacht.id}.`);
            }
        }
       const finalYacht: Yacht = {
        id: String(dbYacht.id || ''), name: String(dbYacht.name || ''), imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0), status: (dbYacht.status || 'Available') as Yacht['status'],
        category: (dbYacht.category || 'Private Cruise') as Yacht['category'],
        packages: packages, customPackageInfo: dbYacht.customPackageInfo || undefined,
       };
       return NextResponse.json(finalYacht, { status: 200 });
    }
    return NextResponse.json({ message: 'Yacht updated, but failed to fetch confirmation.' }, { status: 500 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API PUT /api/yachts/${id}] Failed to update yacht:`, error);
    return NextResponse.json({ message: 'Failed to update yacht', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const result: any = await query('DELETE FROM yachts WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Yacht deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API DELETE /api/yachts/${id}] Failed to delete yacht:`, error);
    return NextResponse.json({ message: 'Failed to delete yacht', error: errorMessage }, { status: 500 });
  }
}
