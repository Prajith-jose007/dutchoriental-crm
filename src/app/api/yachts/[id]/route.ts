// src/app/api/yachts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht } from '@/lib/types';
// import { query } from '@/lib/db'; // You'll need to implement this

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Implement MySQL query to fetch yacht by ID
    // Example: const yachtData = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    // const yacht = yachtData[0] || null;
    const yacht: Yacht | null = null; // Placeholder

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
    const updatedYachtData = await request.json() as Partial<Omit<Yacht, 'id'>>;

    // TODO: First, check if the yacht exists
    // Example: const existingYachtResult = await query('SELECT * FROM yachts WHERE id = ?', [id]);
    // if (existingYachtResult.length === 0) {
    //   return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    // }
    // const yachtToUpdate = existingYachtResult[0];

    const capacity = updatedYachtData.capacity !== undefined ? Number(updatedYachtData.capacity) : undefined; // yachtToUpdate.capacity

    const yachtWithProcessedNumbers: Partial<Yacht> = {
      ...updatedYachtData,
      ...(capacity !== undefined && { capacity }),
      ...(updatedYachtData.childRate !== undefined && { childRate: Number(updatedYachtData.childRate) }),
      ...(updatedYachtData.adultStandardRate !== undefined && { adultStandardRate: Number(updatedYachtData.adultStandardRate) }),
      ...(updatedYachtData.adultStandardDrinksRate !== undefined && { adultStandardDrinksRate: Number(updatedYachtData.adultStandardDrinksRate) }),
      ...(updatedYachtData.vipChildRate !== undefined && { vipChildRate: Number(updatedYachtData.vipChildRate) }),
      ...(updatedYachtData.vipAdultRate !== undefined && { vipAdultRate: Number(updatedYachtData.vipAdultRate) }),
      ...(updatedYachtData.vipAdultDrinksRate !== undefined && { vipAdultDrinksRate: Number(updatedYachtData.vipAdultDrinksRate) }),
      ...(updatedYachtData.royalChildRate !== undefined && { royalChildRate: Number(updatedYachtData.royalChildRate) }),
      ...(updatedYachtData.royalAdultRate !== undefined && { royalAdultRate: Number(updatedYachtData.royalAdultRate) }),
      ...(updatedYachtData.royalDrinksRate !== undefined && { royalDrinksRate: Number(updatedYachtData.royalDrinksRate) }),
      ...(updatedYachtData.otherChargeRate !== undefined && { otherChargeRate: Number(updatedYachtData.otherChargeRate) }),
    };
    
    // TODO: Implement MySQL query to update the yacht
    // Example:
    // const fieldsToUpdate = [];
    // const valuesToUpdate = [];
    // Object.entries(yachtWithProcessedNumbers).forEach(([key, value]) => {
    //    if (key !== 'id') { // Don't update ID
    //      fieldsToUpdate.push(`${key} = ?`);
    //      valuesToUpdate.push(value);
    //    }
    // });
    // if (fieldsToUpdate.length === 0) {
    //    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    // }
    // valuesToUpdate.push(id); // For the WHERE clause
    // const result = await query(`UPDATE yachts SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, valuesToUpdate);
    // if (result.affectedRows === 0) {
    //    return NextResponse.json({ message: 'Yacht not found during update or no changes made' }, { status: 404 });
    // }
    // const finalUpdatedYacht = { ...yachtToUpdate, ...yachtWithProcessedNumbers, id };

    // Placeholder response
    const finalUpdatedYacht = { id, ...yachtWithProcessedNumbers };
    return NextResponse.json(finalUpdatedYacht, { status: 200 });

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
    // TODO: Implement MySQL query to delete yacht by ID
    // Example: const result = await query('DELETE FROM yachts WHERE id = ?', [id]);
    // const wasDeleted = result.affectedRows > 0;
    const wasDeleted = true; // Placeholder
    
    if (!wasDeleted) {
      return NextResponse.json({ message: 'Yacht not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Yacht deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete yacht ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete yacht', error: (error as Error).message }, { status: 500 });
  }
}
