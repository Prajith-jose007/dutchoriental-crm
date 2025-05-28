
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const yachtsData: any[] = await query('SELECT * FROM yachts ORDER BY name ASC');
    console.log('[API GET /api/yachts] Raw DB Data:', yachtsData);
    const yachts: Yacht[] = yachtsData.map(yacht => ({
      ...yacht,
      capacity: Number(yacht.capacity || 0),
      childRate: parseFloat(yacht.childRate || 0),
      adultStandardRate: parseFloat(yacht.adultStandardRate || 0),
      adultStandardDrinksRate: parseFloat(yacht.adultStandardDrinksRate || 0),
      vipChildRate: parseFloat(yacht.vipChildRate || 0),
      vipAdultRate: parseFloat(yacht.vipAdultRate || 0),
      vipAdultDrinksRate: parseFloat(yacht.vipAdultDrinksRate || 0),
      royalChildRate: parseFloat(yacht.royalChildRate || 0),
      royalAdultRate: parseFloat(yacht.royalAdultRate || 0),
      royalDrinksRate: parseFloat(yacht.royalDrinksRate || 0),
      otherChargeRate: parseFloat(yacht.otherChargeRate || 0),
    }));
    console.log('[API GET /api/yachts] Mapped Yachts Data:', yachts);
    return NextResponse.json(yachts, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch yachts:', error);
    return NextResponse.json({ message: 'Failed to fetch yachts', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newYachtData = await request.json() as Omit<Yacht, 'id'> & { id?: string };

    if (!newYachtData.id || !newYachtData.name || newYachtData.capacity === undefined) {
      return NextResponse.json({ message: 'Missing required yacht fields (id, name, capacity)' }, { status: 400 });
    }
    
    const existingYacht: any = await query('SELECT id FROM yachts WHERE id = ?', [newYachtData.id]);
    if (existingYacht.length > 0) {
      return NextResponse.json({ message: `Yacht with ID ${newYachtData.id} already exists.` }, { status: 409 });
    }
    
    const yachtToStore: Yacht = {
      id: newYachtData.id,
      name: newYachtData.name,
      capacity: Number(newYachtData.capacity),
      status: newYachtData.status || 'Available',
      imageUrl: newYachtData.imageUrl || null,
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
      customPackageInfo: newYachtData.customPackageInfo || null,
    };

    const sql = `
      INSERT INTO yachts (
        id, name, imageUrl, capacity, status,
        childRate, adultStandardRate, adultStandardDrinksRate,
        vipChildRate, vipAdultRate, vipAdultDrinksRate,
        royalChildRate, royalAdultRate, royalDrinksRate,
        otherChargeName, otherChargeRate, customPackageInfo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      yachtToStore.id, yachtToStore.name, yachtToStore.imageUrl, yachtToStore.capacity, yachtToStore.status,
      yachtToStore.childRate, yachtToStore.adultStandardRate, yachtToStore.adultStandardDrinksRate,
      yachtToStore.vipChildRate, yachtToStore.vipAdultRate, yachtToStore.vipAdultDrinksRate,
      yachtToStore.royalChildRate, yachtToStore.royalAdultRate, yachtToStore.royalDrinksRate,
      yachtToStore.otherChargeName, yachtToStore.otherChargeRate, yachtToStore.customPackageInfo
    ];
    const result: any = await query(sql, params);

    if (result.affectedRows === 1) {
      return NextResponse.json(yachtToStore, { status: 201 });
    } else {
      throw new Error('Failed to insert yacht into database');
    }
    
  } catch (error) {
    console.error('Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht', error: (error as Error).message }, { status: 500 });
  }
}
