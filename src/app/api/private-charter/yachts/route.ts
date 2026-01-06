
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const results = await query<any[]>('SELECT * FROM pc_yachts ORDER BY name ASC');
        const yachts = results.map(row => ({
            ...row,
            images: JSON.parse(row.images_json || '[]'),
            amenities: JSON.parse(row.amenities_json || '[]'),
            createdAt: row.createdAt?.toISOString(),
            updatedAt: row.updatedAt?.toISOString(),
        }));
        return NextResponse.json(yachts);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const id = body.id || `PCY-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const sql = `
      INSERT INTO pc_yachts (
        id, name, category, capacity, cabinsCount, crewCount, location, 
        pricePerHour, minHours, images_json, amenities_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            id, body.name, body.category, body.capacity, body.cabinsCount, body.crewCount,
            body.location, body.pricePerHour, body.minHours,
            JSON.stringify(body.images || []), JSON.stringify(body.amenities || []),
            body.status || 'Available'
        ];

        await query(sql, params);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
