
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

// Helper to ensure date strings are in a consistent format for DB or client (not used for yachts currently)
const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    if (isValid(dateString)) return formatISO(dateString);
    return null;
  }
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return formatISO(parsed);
    return dateString;
  } catch {
    return dateString;
  }
};

export async function GET(request: NextRequest) {
  console.log('[API GET /api/yachts] Received request');
  try {
    const sql = `
      SELECT id, name, imageUrl, capacity, status, customPackageInfo,
             childRate, adultStandardRate, adultStandardDrinksRate,
             vipChildRate, vipAdultRate, vipAdultDrinksRate,
             royalChildRate, royalAdultRate, royalDrinksRate,
             otherChargeName, otherChargeRate
      FROM yachts ORDER BY name ASC
    `;
    console.log('[API GET /api/yachts] Executing SQL:', sql.trim());
    const yachtsDataDb: any[] = await query(sql);
    console.log('[API GET /api/yachts] Raw DB Data (count):', yachtsDataDb.length);
    if (yachtsDataDb.length > 0) {
        console.log('[API GET /api/yachts] Raw DB Data Sample (first item):', yachtsDataDb[0]);
    }

    const yachts: Yacht[] = yachtsDataDb.map(dbYacht => {
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
        
        otherChargeName: dbYacht.otherChargeName || undefined,
        otherChargeRate: Number(dbYacht.otherChargeRate || 0),
      };
    });

    console.log('[API GET /api/yachts] Mapped Yachts Data (count):', yachts.length);
    if (yachts.length > 0) {
        console.log('[API GET /api/yachts] Mapped Yachts Data Sample (first item):', yachts[0]);
    }
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
    
    const existingYacht: any[] = await query('SELECT id FROM yachts WHERE id = ?', [newYachtData.id]);
    if (existingYacht.length > 0) {
        return NextResponse.json({ message: `Yacht with ID ${newYachtData.id} already exists.` }, { status: 409 });
    }

    const sql = `
      INSERT INTO yachts (
        id, name, imageUrl, capacity, status, customPackageInfo,
        childRate, adultStandardRate, adultStandardDrinksRate,
        vipChildRate, vipAdultRate, vipAdultDrinksRate,
        royalChildRate, royalAdultRate, royalDrinksRate,
        otherChargeName, otherChargeRate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      newYachtData.otherChargeName || null,
      Number(newYachtData.otherChargeRate || 0),
    ];

    console.log('[API POST /api/yachts] Executing SQL:', sql.trim(), 'with params:', params);
    const result: any = await query(sql, params);
    console.log('[API POST /api/yachts] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      const createdYachtQuery: any[] = await query('SELECT * FROM yachts WHERE id = ?', [newYachtData.id]);
      if (createdYachtQuery.length > 0) {
        const dbYacht = createdYachtQuery[0];
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
            otherChargeName: dbYacht.otherChargeName || undefined,
            otherChargeRate: Number(dbYacht.otherChargeRate || 0),
        };
        console.log('[API POST /api/yachts] Successfully created yacht:', finalYacht.id);
        return NextResponse.json(finalYacht, { status: 201 });
      }
      console.warn('[API POST /api/yachts] Yacht inserted, but failed to fetch for confirmation.');
      // Construct the response from input data as a fallback
      const fallbackYacht: Yacht = {
        id: newYachtData.id!,
        name: newYachtData.name!,
        imageUrl: newYachtData.imageUrl || undefined,
        capacity: Number(newYachtData.capacity || 0),
        status: (newYachtData.status || 'Available') as Yacht['status'],
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
        otherChargeName: newYachtData.otherChargeName || undefined,
        otherChargeRate: Number(newYachtData.otherChargeRate || 0),
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
