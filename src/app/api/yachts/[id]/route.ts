
// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { placeholderYachts } from '@/lib/placeholder-data';

// In-memory store (should be consistent with /api/yachts/route.ts)
let yachts_db: Yacht[] = [...placeholderYachts];


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Replace with actual database query: SELECT * FROM yachts WHERE id = ?
    const yacht = yachts_db.find(y => y.id === id);

    if (yacht) {
      return NextResponse.json(yacht, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch yacht ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch yacht', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedYachtData = await request.json() as Partial<Yacht>;

    // TODO: Replace with actual database update operation
    const yachtIndex = yachts_db.findIndex(y => y.id === id);
    if (yachtIndex === -1) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }
    yachts_db[yachtIndex] = { ...yachts_db[yachtIndex], ...updatedYachtData, id }; // Ensure ID isn't overwritten
    const updatedYacht = yachts_db[yachtIndex];

    return NextResponse.json(updatedYacht, { status: 200 });
  } catch (error) {
    console.error(`Failed to update yacht ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update yacht', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Replace with actual database delete operation
    const yachtIndex = yachts_db.findIndex(y => y.id === id);
    if (yachtIndex === -1) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }
    yachts_db.splice(yachtIndex, 1);

    return NextResponse.json({ message: 'Yacht deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete yacht ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete yacht', error: (error as Error).message }, { status: 500 });
  }
}

```