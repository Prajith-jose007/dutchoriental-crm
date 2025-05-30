
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
              otherChargeName, otherChargeRate, customPackageInfo 
       FROM yachts ORDER BY name ASC`
    );
    console.log('[API GET /api/yachts] Raw DB Data (first item):', yachtsDataDb.length > 0 ? yachtsDataDb[0] : "No yachts from DB");

    const yachts: Yacht[] = yachtsDataDb.map(dbYacht => ({
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
    }));
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

    const existingYachtCheck: any = await query('SELECT id FROM yachts WHERE id = ?', [newYachtData.id]);
    if (existingYachtCheck.length > 0) {
      return NextResponse.json({ message: `Yacht with ID ${newYachtData.id} already exists.` }, { status: 409 });
    }

    const yachtToStore: Yacht = {
      id: newYachtData.id,
      name: newYachtData.name,
      imageUrl: newYachtData.imageUrl || null,
      capacity: Number(newYachtData.capacity || 0),
      status: newYachtData.status || 'Available',
      customPackageInfo: newYachtData.customPackageInfo || null,

      childRate: Number(newYachtData.childRate || 0),
      adultStandardRate: Number(newYachtData.adultStandardRate || 0),
      adultStandardDrinksRate: Number(newYachtData.adultStandardDrinksRate || 0),
      vipChildRate: Number(newYachtData.vipChildRate || 0),
      vipAdultRate: Number(newYachtData.vipAdultRate || 0),
      vipAdultDrinksRate: Number(newYachtData.vipAdultDrinksRate || 0),
      royalChildRate: Number(newYachtData.royalChildRate || 0),
      royalAdultRate: Number(newYachtData.royalAdultRate || 0),
      royalDrinksRate: Number(newYachtData.royalDrinksRate || 0),
      
      otherChargeName: newYachtData.otherChargeName || null,
      otherChargeRate: Number(newYachtData.otherChargeRate || 0),
    };

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
      yachtToStore.id, yachtToStore.name, yachtToStore.imageUrl, yachtToStore.capacity, yachtToStore.status, yachtToStore.customPackageInfo,
      yachtToStore.childRate, yachtToStore.adultStandardRate, yachtToStore.adultStandardDrinksRate,
      yachtToStore.vipChildRate, yachtToStore.vipAdultRate, yachtToStore.vipAdultDrinksRate,
      yachtToStore.royalChildRate, yachtToStore.royalAdultRate, yachtToStore.royalDrinksRate,
      yachtToStore.otherChargeName, yachtToStore.otherChargeRate
    ];

    console.log('[API POST /api/yachts] Executing SQL:', sql, 'with params:', params);
    const result: any = await query(sql, params);
    console.log('[API POST /api/yachts] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      // Fetch the created yacht to ensure all DB defaults/triggers are reflected
      const createdYachtData: any[] = await query('SELECT * FROM yachts WHERE id = ?', [yachtToStore.id]);
      if (createdYachtData.length > 0) {
        const dbYacht = createdYachtData[0];
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
      // Fallback if fetch after insert fails, return the input data
      console.warn('[API POST /api/yachts] Yacht inserted, but failed to fetch for confirmation. Returning original payload.');
      return NextResponse.json(yachtToStore, { status: 201 });
    } else {
      console.error('[API POST /api/yachts] Failed to insert yacht into database, affectedRows not 1.');
      throw new Error('Failed to insert yacht into database');
    }
  } catch (error) {
    console.error('[API POST /api/yachts] Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht. Check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
