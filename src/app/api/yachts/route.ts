
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { query } from '@/lib/db'; // Assuming your db utility is in src/lib/db.ts

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
    console.log('[API GET /api/yachts] Raw DB Data (first item):', yachtsDataDb.length > 0 ? yachtsDataDb[0] : "No yachts from DB");

    const yachts: Yacht[] = yachtsDataDb.map(dbYacht => {
      let parsedOtherCharges: Array<{ id: string; name: string; rate: number }> = [];
      if (dbYacht.other_charges_json && typeof dbYacht.other_charges_json === 'string') {
        try {
          const tempParsed = JSON.parse(dbYacht.other_charges_json);
          if (Array.isArray(tempParsed)) {
            parsedOtherCharges = tempParsed.map((item: any) => ({
              id: String(item.id || `charge-${Math.random().toString(36).substring(2, 9)}`), // Ensure ID is a string
              name: String(item.name || 'Unnamed Charge'), // Ensure name is a string
              rate: Number(item.rate || 0), // Ensure rate is a number
            }));
          } else {
            console.warn(`[API GET /api/yachts] Parsed other_charges_json for yacht ${dbYacht.id} is not an array. Found:`, tempParsed);
          }
        } catch (e) {
          console.warn(`[API GET /api/yachts] Failed to parse other_charges_json for yacht ${dbYacht.id}:`, e, "Raw JSON:", dbYacht.other_charges_json);
        }
      } else if (dbYacht.other_charges_json) {
        console.warn(`[API GET /api/yachts] other_charges_json for yacht ${dbYacht.id} is not a string. Found:`, typeof dbYacht.other_charges_json);
      }

      return {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || ''),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        customPackageInfo: dbYacht.customPackageInfo || undefined,
        // Package Rates
        childRate: Number(dbYacht.childRate || 0),
        adultStandardRate: Number(dbYacht.adultStandardRate || 0),
        adultStandardDrinksRate: Number(dbYacht.adultStandardDrinksRate || 0),
        vipChildRate: Number(dbYacht.vipChildRate || 0),
        vipAdultRate: Number(dbYacht.vipAdultRate || 0),
        vipAdultDrinksRate: Number(dbYacht.vipAdultDrinksRate || 0),
        royalChildRate: Number(dbYacht.royalChildRate || 0),
        royalAdultRate: Number(dbYacht.royalAdultRate || 0),
        royalDrinksRate: Number(dbYacht.royalDrinksRate || 0),
        // Other Charges Array
        otherCharges: parsedOtherCharges,
      };
    });
    console.log('[API GET /api/yachts] Mapped Yachts Data (first item):', yachts.length > 0 ? yachts[0] : "No yachts mapped");
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

    // Check if yacht with this ID already exists
    const existingYachtCheck: any[] = await query('SELECT id FROM yachts WHERE id = ?', [newYachtData.id]);
    if (existingYachtCheck.length > 0) {
      return NextResponse.json({ message: `Yacht with ID ${newYachtData.id} already exists.` }, { status: 409 });
    }

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
    `;
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

    console.log('[API POST /api/yachts] Executing SQL:', sql, 'with params:', params);
    const result: any = await query(sql, params);
    console.log('[API POST /api/yachts] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      // Fetch and return the created yacht for consistency
      const createdYachtData: any[] = await query('SELECT * FROM yachts WHERE id = ?', [newYachtData.id]);
      if (createdYachtData.length > 0) {
        const dbYacht = createdYachtData[0];
        let parsedOtherCharges: Array<{ id: string; name: string; rate: number }> = [];
        if (dbYacht.other_charges_json && typeof dbYacht.other_charges_json === 'string') {
          try {
            parsedOtherCharges = JSON.parse(dbYacht.other_charges_json);
             if (!Array.isArray(parsedOtherCharges)) parsedOtherCharges = [];
          } catch (e) { /* ignore, will default to empty array */ }
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
      // Fallback if fetch fails, construct from input (less ideal)
      console.warn('[API POST /api/yachts] Yacht inserted, but failed to fetch for confirmation.');
      const fallbackYacht: Yacht = {
        id: newYachtData.id!,
        name: newYachtData.name!,
        imageUrl: newYachtData.imageUrl || undefined,
        capacity: Number(newYachtData.capacity || 0),
        status: newYachtData.status || 'Available',
        customPackageInfo: newYachtData.customPackageInfo || undefined,
        childRate: Number(newYachtData.childRate || 0),
        adultStandardRate: Number(newYachtData.adultStandardRate || 0),
        adultStandardDrinksRate: Number(newYachtData.adultStandardDrinksRate || 0),
        vipChildRate: Number(newYachtData.vipChildRate || 0),
        vipAdultRate: Number(newYachtData.vipAdultRate || 0),
        vipAdultDrinksRate: Number(newYachtData.vipAdultDrinksRate || 0),
        royalChildRate: Number(newYachtData.royalChildRate || 0),
        royalAdultRate: Number(newYachtData.royalAdultRate || 0),
        royalDrinksRate: Number(newYachtData.royalDrinksRate || 0),
        otherCharges: newYachtData.otherCharges || [],
      };
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
