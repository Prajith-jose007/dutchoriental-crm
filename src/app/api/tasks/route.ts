
// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Task } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const bookingId = searchParams.get('bookingId');
    const opportunityId = searchParams.get('opportunityId');

    if (!leadId && !bookingId && !opportunityId) {
        return NextResponse.json({ message: 'Missing leadId, bookingId, or opportunityId' }, { status: 400 });
    }

    try {
        let sql = 'SELECT * FROM tasks WHERE 1=1';
        const params: any[] = [];
        if (leadId) {
            sql += ' AND leadId = ?';
            params.push(leadId);
        }
        if (bookingId) {
            sql += ' AND bookingId = ?';
            params.push(bookingId);
        }
        if (opportunityId) {
            sql += ' AND opportunityId = ?';
            params.push(opportunityId);
        }
        sql += ' ORDER BY createdAt DESC';

        const tasks = await query<Task[]>(sql, params);
        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { leadId, bookingId, opportunityId, type, notes, assignedTo, dueDate, status } = body;

        if (!leadId && !bookingId && !opportunityId) {
            return NextResponse.json({ message: 'Missing leadId, bookingId, or opportunityId' }, { status: 400 });
        }

        const newTask: Task = {
            id: randomUUID(),
            leadId: leadId || null,
            bookingId: bookingId || null,
            opportunityId: opportunityId || null,
            type: type || 'Call',
            notes: notes || '',
            assignedTo: assignedTo || null,
            dueDate: dueDate || new Date().toISOString(),
            status: status || 'Pending',
            createdAt: new Date().toISOString(),
        };

        const sql = `
      INSERT INTO tasks (id, leadId, bookingId, opportunityId, type, dueDate, assignedTo, status, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await query(sql, [
            newTask.id, newTask.leadId, newTask.bookingId, newTask.opportunityId, newTask.type,
            newTask.dueDate, newTask.assignedTo, newTask.status,
            newTask.notes, newTask.createdAt
        ]);

        return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
