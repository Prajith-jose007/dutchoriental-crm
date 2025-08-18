
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    let sql = 'SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users';
    const params: any[] = [];

    if (name) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${name}%`);
    }
    
    sql += ' ORDER BY name ASC';

    const usersDataDb: any[] = await query(sql, params);
    
    const users: User[] = usersDataDb.map((dbUser: any) => ({
      id: String(dbUser.id || ''), 
      name: dbUser.name || '', 
      email: dbUser.email || '',
      designation: dbUser.designation || '', 
      avatarUrl: dbUser.avatarUrl || undefined,
      websiteUrl: dbUser.websiteUrl || undefined, 
      status: dbUser.status || 'Active',
      // DO NOT include password in the response to the client
    }));
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API GET /api/users] Error fetching users:', error);
    return NextResponse.json({ message: `Failed to fetch users: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newUser = await request.json() as User;
    
    if (!newUser.id || !newUser.name || !newUser.email || !newUser.designation || !newUser.password) {
      return NextResponse.json({ message: 'Missing required user fields (id, name, email, designation, password)' }, { status: 400 });
    }

    const existingUserCheck: any = await query('SELECT id FROM users WHERE id = ? OR email = ?', [newUser.id, newUser.email]);
    if (existingUserCheck.length > 0) {
      return NextResponse.json({ message: 'User with this ID or email already exists.' }, { status: 409 });
    }
    
    const result: any = await query(
      'INSERT INTO users (id, name, email, designation, avatarUrl, websiteUrl, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newUser.id, newUser.name, newUser.email, newUser.designation, newUser.avatarUrl || null,
        newUser.websiteUrl || null, newUser.status || 'Active', newUser.password, // In a real app, hash this password
      ]
    );

    if (result.affectedRows === 1) {
      const createdUserQuery: any = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [newUser.id]);
      if (createdUserQuery.length > 0) {
        return NextResponse.json(createdUserQuery[0] as User, { status: 201 });
      }
    }
    throw new Error('Failed to insert user into database');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API POST /api/users] Error creating user:', error);
    return NextResponse.json({ message: `Failed to create user: ${errorMessage}` }, { status: 500 });
  }
}
