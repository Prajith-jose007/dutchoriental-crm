// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
// import { query } from '@/lib/db'; // You'll need to implement this

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query: SELECT * FROM yachts ORDER BY name ASC
    // Example: const yachtsData = await query('SELECT * FROM yachts ORDER BY name ASC');
    const yachts: Yacht[] = []; // Replace with actual data from DB
    return NextResponse.json(yachts, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch yachts:', error);
    return NextResponse.json({ message: 'Failed to fetch yachts', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newYachtData = await request.json() as Omit<Yacht, 'id'> & { id?: string };

    if (!newYachtData.id || !newYachtData.name || !newYachtData.capacity) {
      return NextResponse.json({ message: 'Missing required yacht fields (id, name, capacity)' }, { status: 400 });
    }
    
    // TODO: Check if yacht with this ID already exists in the database
    // Example: const existingYacht = await query('SELECT id FROM yachts WHERE id = ?', [newYachtData.id]);
    // if (existingYacht.length > 0) {
    //   return NextResponse.json({ message: `Yacht with ID ${newYachtData.id} already exists.` }, { status: 409 });
    // }
    
    const yachtToStore: Yacht = {
      id: newYachtData.id,
      name: newYachtData.name,
      capacity: Number(newYachtData.capacity),
      status: newYachtData.status || 'Available',
      imageUrl: newYachtData.imageUrl,
      childRate: Number(newYachtData.childRate) || 0,
      adultStandardRate: Number(newYachtData.adultStandardRate) || 0,
      adultStandardDrinksRate: Number(newYachtData.adultStandardDrinksRate) || 0,
      vipChildRate: Number(newYachtData.vipChildRate) || 0,
      vipAdultRate: Number(newYachtData.vipAdultRate) || 0,
      vipAdultDrinksRate: Number(newYachtData.vipAdultDrinksRate) || 0,
      royalChildRate: Number(newYachtData.royalChildRate) || 0,
      royalAdultRate: Number(newYachtData.royalAdultRate) || 0,
      royalDrinksRate: Number(newYachtData.royalDrinksRate) || 0,
      otherChargeName: newYachtData.otherChargeName,
      otherChargeRate: Number(newYachtData.otherChargeRate) || 0,
      customPackageInfo: newYachtData.customPackageInfo,
    };

    // TODO: Implement MySQL query to insert yachtToStore
    // Example: const result = await query('INSERT INTO yachts SET ?', yachtToStore);
    // if (result.affectedRows === 1) {
    //   return NextResponse.json(yachtToStore, { status: 201 });
    // } else {
    //   throw new Error('Failed to insert yacht into database');
    // }

    // Placeholder response
    return NextResponse.json(yachtToStore, { status: 201 });
    
  } catch (error) {
    console.error('Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht', error: (error as Error).message }, { status: 500 });
  }
}
