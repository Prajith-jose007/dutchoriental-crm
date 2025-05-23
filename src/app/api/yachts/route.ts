
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { placeholderYachts } from '@/lib/placeholder-data'; // Used for initial data if DB is empty

// In-memory store (replace with actual database calls)
let yachts_db: Yacht[] = [...placeholderYachts]; // Initialize with placeholder data

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
    const newYacht = await request.json() as Yacht;

    if (!newYacht.id || !newYacht.name || !newYacht.capacity) {
      return NextResponse.json({ message: 'Missing required yacht fields' }, { status: 400 });
    }

    // TODO: Replace with actual database insert operation
    const existingYacht = yachts_db.find(y => y.id === newYacht.id);
    if (existingYacht) {
      return NextResponse.json({ message: `Yacht with ID ${newYacht.id} already exists.` }, { status: 409 });
    }
    yachts_db.push(newYacht);
    
    return NextResponse.json(newYacht, { status: 201 });
  } catch (error) {
    console.error('Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht', error: (error as Error).message }, { status: 500 });
  }
}

```