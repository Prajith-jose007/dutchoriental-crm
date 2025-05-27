
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { placeholderYachts } from '@/lib/placeholder-data'; // Used for initial data if DB is empty

// In-memory store (replace with actual database calls)
let yachts_db: Yacht[] = JSON.parse(JSON.stringify(placeholderYachts)); // Initialize with a deep copy

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query: SELECT * FROM yachts
    return NextResponse.json(yachts_db, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch yachts:', error);
    return NextResponse.json({ message: 'Failed to fetch yachts', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newYachtData = await request.json() as Omit<Yacht, 'id'> & { id?: string };

    if (!newYachtData.name || !newYachtData.capacity) { // ID is now optional for creation, can be auto-generated
      return NextResponse.json({ message: 'Missing required yacht fields (name, capacity)' }, { status: 400 });
    }

    const newYachtId = newYachtData.id || `DO-yacht-${Date.now()}`;
    
    const existingYacht = yachts_db.find(y => y.id === newYachtId);
    if (existingYacht) {
      return NextResponse.json({ message: `Yacht with ID ${newYachtId} already exists.` }, { status: 409 });
    }
    
    const yachtToStore: Yacht = {
      id: newYachtId,
      name: newYachtData.name,
      capacity: Number(newYachtData.capacity),
      status: newYachtData.status || 'Available',
      imageUrl: newYachtData.imageUrl,
      // New rates
      childRate: Number(newYachtData.childRate) || 0,
      adultStandardRate: Number(newYachtData.adultStandardRate) || 0,
      adultStandardDrinksRate: Number(newYachtData.adultStandardDrinksRate) || 0,
      vipChildRate: Number(newYachtData.vipChildRate) || 0,
      vipAdultRate: Number(newYachtData.vipAdultRate) || 0,
      vipAdultDrinksRate: Number(newYachtData.vipAdultDrinksRate) || 0,
      royalChildRate: Number(newYachtData.royalChildRate) || 0,
      royalAdultRate: Number(newYachtData.royalAdultRate) || 0,
      royalDrinksRate: Number(newYachtData.royalDrinksRate) || 0,
      othersAmtCake_rate: Number(newYachtData.othersAmtCake_rate) || 0,
      customPackageInfo: newYachtData.customPackageInfo,
    };

    yachts_db.push(yachtToStore);
    
    return NextResponse.json(yachtToStore, { status: 201 });
  } catch (error) {
    console.error('Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht', error: (error as Error).message }, { status: 500 });
  }
}

