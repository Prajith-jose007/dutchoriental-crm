
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('[API GET /api/yachts] Received request');
  try {
    const yachtsDataDb: any[] = await query(
      `SELECT id, name, imageUrl, capacity, status, 
              childRate, adultStandardRate, adultStandardDrinksRate,
              vipChildRate, vipAdultRate, vipAdultDrinksRate,
              royalChildRate, royalAdultRate, royalDrinksRate,
              other_charges_json, customPackageInfo
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
      } else if (dbYacht.other_charges_json) {
        console.warn(`[API GET /api/yachts] other_charges_json for yacht ${dbYacht.id} is not a string. Found:`, typeof dbYacht.other_charges_json, "Value:", dbYacht.other_charges_json);
      }

      return {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || 'Unnamed Yacht'),
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
    });
    console.log('[API GET /api/yachts] Mapped Yachts Data (first item if any):', yachts.length > 0 ? yachts[0] : "No yachts mapped");
    return NextResponse.json(yachts, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/yachts] Failed to fetch yachts:', error);
    return NextResponse.json({ message: 'Failed to fetch yachts. Check server logs.', error: (error as Error).message }, { status: 500 });
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

    // Stringify otherCharges if it exists and is an array, otherwise use null
    const otherChargesJsonString = newYachtData.otherCharges && Array.isArray(newYachtData.otherCharges)
      ? JSON.stringify(newYachtData.otherCharges)
      : null;

    const sql = `
      INSERT INTO yachts (
        id, name, imageUrl, capacity, status, customPackageInfo,
        childRate, adultStandardRate, adultStandardDrinksRate,
        vipChildRate, vipAdultRate, vipAdultDrinksRate,
        royalChildRate, royalAdultRate, royalDrinksRate,
        other_charges_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `; // Matched ? to columns
    const params = [
      newYachtData.id,
      newYachtData.name,
      newYachtData.imageUrl || null,
      Number(newYachtData.capacity || 0),
      newYachtData.status || 'Available',
      newYachtData.customPackageInfo || null,
      Number(newYachtData.childRate || 0),
      Number(newYachtData.adultStandardRate || 0),
      Number(newYachtData.adultStandardDrinksRate || 0),
      Number(newYachtData.vipChildRate || 0),
      Number(newYachtData.vipAdultRate || 0),
      Number(newYachtData.vipAdultDrinksRate || 0),
      Number(newYachtData.royalChildRate || 0),
      Number(newYachtData.royalAdultRate || 0),
      Number(newYachtData.royalDrinksRate || 0),
      otherChargesJsonString,
    ];

    console.log('[API POST /api/yachts] Executing SQL:', sql.trim(), 'with params:', params);
    const result: any = await query(sql, params);
    console.log('[API POST /api/yachts] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      const createdYachtFromDb: any[] = await query('SELECT * FROM yachts WHERE id = ?', [newYachtData.id]);
      if (createdYachtFromDb.length > 0) {
        const dbYacht = createdYachtFromDb[0];
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
        console.log('[API POST /api/yachts] Successfully created yacht:', finalYacht.id);
        return NextResponse.json(finalYacht, { status: 201 });
      }
      console.warn('[API POST /api/yachts] Yacht inserted, but failed to fetch for confirmation.');
      return NextResponse.json({ ...newYachtData, id: newYachtData.id! }, { status: 201 });
    } else {
      console.error('[API POST /api/yachts] Failed to insert yacht into database, affectedRows not 1.');
      throw new Error('Failed to insert yacht into database');
    }
  } catch (error) {
    console.error('[API POST /api/yachts] Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht. Check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
