
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('[API GET /api/yachts] Received request');
  try {
    // Explicitly list columns to match the current Yacht type which uses other_charges_json
    const yachtsDataDb: any[] = await query(
      `SELECT id, name, imageUrl, capacity, status, customPackageInfo, other_charges_json
       FROM yachts ORDER BY name ASC`
    );
    console.log('[API GET /api/yachts] Raw DB Data (first item if any):', yachtsDataDb.length > 0 ? yachtsDataDb[0] : "No yachts from DB");

    const yachts: Yacht[] = yachtsDataDb.map(dbYacht => {
      let parsedOtherCharges: Array<{ id: string; name: string; rate: number }> = [];
      if (dbYacht.other_charges_json && typeof dbYacht.other_charges_json === 'string') {
        try {
          const tempParsed = JSON.parse(dbYacht.other_charges_json);
          if (Array.isArray(tempParsed)) {
            // Ensure each item in the array has the correct structure
            parsedOtherCharges = tempParsed.map((item: any, index: number) => ({
              id: String(item.id || `charge-${dbYacht.id}-${index}`), 
              name: String(item.name || 'Unnamed Charge'), 
              rate: Number(item.rate || 0), 
            }));
          } else {
            console.warn(`[API GET /api/yachts] Parsed other_charges_json for yacht ${dbYacht.id} is not an array. Found:`, tempParsed);
          }
        } catch (e) {
          console.warn(`[API GET /api/yachts] Failed to parse other_charges_json for yacht ${dbYacht.id}:`, (e as Error).message, "Raw JSON:", dbYacht.other_charges_json);
        }
      } else if (dbYacht.other_charges_json) { // If it exists but not a string
         console.warn(`[API GET /api/yachts] other_charges_json for yacht ${dbYacht.id} is not a string. Found:`, typeof dbYacht.other_charges_json, "Value:", dbYacht.other_charges_json);
      }

      return {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || 'Unnamed Yacht'),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        customPackageInfo: dbYacht.customPackageInfo || undefined,
        otherCharges: parsedOtherCharges, // This now correctly maps to the type
      };
    });

    console.log('[API GET /api/yachts] Mapped Yachts Data (first item if any):', yachts.length > 0 ? yachts[0] : "No yachts mapped");
    return NextResponse.json(yachts, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/yachts] Failed to fetch yachts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch yachts. Check server logs.', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('[API POST /api/yachts] Received request');
  try {
    const newYachtData = await request.json() as Omit<Yacht, 'id'> & { id?: string };
    console.log('[API POST /api/yachts] Received data:', newYachtData);

    if (!newYachtData.id || !newYachtData.name || newYachtData.capacity === undefined) {
      return NextResponse.json({ message: 'Missing required yacht fields (id, name, capacity)' }, { status: 400 });
    }
    
    const otherChargesJsonString = newYachtData.otherCharges && Array.isArray(newYachtData.otherCharges)
      ? JSON.stringify(newYachtData.otherCharges)
      : null;

    const sql = `
      INSERT INTO yachts (
        id, name, imageUrl, capacity, status, customPackageInfo, other_charges_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      newYachtData.id,
      newYachtData.name,
      newYachtData.imageUrl || null,
      Number(newYachtData.capacity || 0),
      newYachtData.status || 'Available',
      newYachtData.customPackageInfo || null,
      otherChargesJsonString,
    ];

    console.log('[API POST /api/yachts] Executing SQL:', sql.trim(), 'with params:', params);
    const result: any = await query(sql, params);
    console.log('[API POST /api/yachts] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      const createdYachtQuery: any[] = await query('SELECT * FROM yachts WHERE id = ?', [newYachtData.id]);
      if (createdYachtQuery.length > 0) {
        const dbYacht = createdYachtQuery[0];
        let parsedOtherCharges: Array<{ id: string; name: string; rate: number }> = [];
         if (dbYacht.other_charges_json && typeof dbYacht.other_charges_json === 'string') {
          try {
            parsedOtherCharges = JSON.parse(dbYacht.other_charges_json);
            if (!Array.isArray(parsedOtherCharges)) parsedOtherCharges = [];
          } catch (e) { 
            console.warn(`[API POST /api/yachts] Error parsing other_charges_json for newly created yacht ${dbYacht.id}:`, (e as Error).message);
            parsedOtherCharges = [];
          }
        }
        const finalYacht: Yacht = {
            id: String(dbYacht.id || ''),
            name: String(dbYacht.name || ''),
            imageUrl: dbYacht.imageUrl || undefined,
            capacity: Number(dbYacht.capacity || 0),
            status: (dbYacht.status || 'Available') as Yacht['status'],
            customPackageInfo: dbYacht.customPackageInfo || undefined,
            otherCharges: parsedOtherCharges,
        };
        console.log('[API POST /api/yachts] Successfully created yacht:', finalYacht.id);
        return NextResponse.json(finalYacht, { status: 201 });
      }
      console.warn('[API POST /api/yachts] Yacht inserted, but failed to fetch for confirmation.');
      // Fallback: Return the input data, ensuring otherCharges is an array
      const fallbackYacht = { ...newYachtData, id: newYachtData.id!, otherCharges: newYachtData.otherCharges || [] };
      return NextResponse.json(fallbackYacht, { status: 201 });
    } else {
      console.error('[API POST /api/yachts] Failed to insert yacht into database, affectedRows not 1.');
      throw new Error('Failed to insert yacht into database');
    }
  } catch (error) {
    console.error('[API POST /api/yachts] Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht. Check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
