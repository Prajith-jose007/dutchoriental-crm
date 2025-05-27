
// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
import { placeholderYachts } from '@/lib/placeholder-data'; // Only used if yachts_db is empty in route.ts

// In-memory store - This should ideally be shared with route.ts if it's mutable and needs to be consistent.
// For a prototype, we'll assume it gets re-initialized or you'll replace this with a DB call.
// To ensure consistency with the main route.ts, this file should ideally import yachts_db from there
// or use a shared db module. For now, we'll create a local one for PUT/DELETE.
// THIS IS A SIMPLIFICATION. A REAL APP WOULD SHARE THE DB INSTANCE.
let yachts_db_local_instance_for_put_delete: Yacht[] = JSON.parse(JSON.stringify(placeholderYachts)); 
// Ideally, this would be: import { yachts_db } from '../route'; and ensure yachts_db is exported and mutable.

// Helper function to sync with a potentially global db instance (simulated)
// In a real scenario, you'd just use one DB connection/instance.
const getDbInstance = () => {
    // This is a placeholder. In a real app, you'd have a proper DB module.
    // For now, to make PUT/DELETE work on the data fetched by GET in `../route.ts`
    // we'd need to modify `../route.ts` to export its `yachts_db` or use a common store.
    // Let's assume for the prototype, we operate on a local copy for PUT/DELETE for now.
    // A better solution would be a src/lib/db/yacht-store.ts similar to agent-store.ts
    return yachts_db_local_instance_for_put_delete; 
}
const saveDbInstance = (newDb: Yacht[]) => {
    yachts_db_local_instance_for_put_delete = newDb;
    // Here you would also update the main instance if they were separate.
}


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const yachts_db = getDbInstance();
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
    let yachts_db = getDbInstance();

    const yachtIndex = yachts_db.findIndex(y => y.id === id);
    if (yachtIndex === -1) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    // Ensure numeric fields are numbers
    const capacity = updatedYachtData.capacity !== undefined ? Number(updatedYachtData.capacity) : yachts_db[yachtIndex].capacity;

    const updatedYacht: Yacht = {
      ...yachts_db[yachtIndex],
      ...updatedYachtData,
      id, // Ensure ID isn't overwritten
      capacity,
      // Ensure all new rate fields are numbers, defaulting to current value or 0 if not provided
      childRate: updatedYachtData.childRate !== undefined ? Number(updatedYachtData.childRate) : yachts_db[yachtIndex].childRate || 0,
      adultStandardRate: updatedYachtData.adultStandardRate !== undefined ? Number(updatedYachtData.adultStandardRate) : yachts_db[yachtIndex].adultStandardRate || 0,
      adultStandardDrinksRate: updatedYachtData.adultStandardDrinksRate !== undefined ? Number(updatedYachtData.adultStandardDrinksRate) : yachts_db[yachtIndex].adultStandardDrinksRate || 0,
      vipChildRate: updatedYachtData.vipChildRate !== undefined ? Number(updatedYachtData.vipChildRate) : yachts_db[yachtIndex].vipChildRate || 0,
      vipAdultRate: updatedYachtData.vipAdultRate !== undefined ? Number(updatedYachtData.vipAdultRate) : yachts_db[yachtIndex].vipAdultRate || 0,
      vipAdultDrinksRate: updatedYachtData.vipAdultDrinksRate !== undefined ? Number(updatedYachtData.vipAdultDrinksRate) : yachts_db[yachtIndex].vipAdultDrinksRate || 0,
      royalChildRate: updatedYachtData.royalChildRate !== undefined ? Number(updatedYachtData.royalChildRate) : yachts_db[yachtIndex].royalChildRate || 0,
      royalAdultRate: updatedYachtData.royalAdultRate !== undefined ? Number(updatedYachtData.royalAdultRate) : yachts_db[yachtIndex].royalAdultRate || 0,
      royalDrinksRate: updatedYachtData.royalDrinksRate !== undefined ? Number(updatedYachtData.royalDrinksRate) : yachts_db[yachtIndex].royalDrinksRate || 0,
      othersAmtCake_rate: updatedYachtData.othersAmtCake_rate !== undefined ? Number(updatedYachtData.othersAmtCake_rate) : yachts_db[yachtIndex].othersAmtCake_rate || 0,
      customPackageInfo: updatedYachtData.customPackageInfo !== undefined ? updatedYachtData.customPackageInfo : yachts_db[yachtIndex].customPackageInfo,
    };
    
    yachts_db[yachtIndex] = updatedYacht;
    saveDbInstance(yachts_db);


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
    let yachts_db = getDbInstance();
    const initialLength = yachts_db.length;
    yachts_db = yachts_db.filter(y => y.id !== id);
    
    if (yachts_db.length === initialLength) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }
    saveDbInstance(yachts_db);

    return NextResponse.json({ message: 'Yacht deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete yacht ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete yacht', error: (error as Error).message }, { status: 500 });
  }
}

