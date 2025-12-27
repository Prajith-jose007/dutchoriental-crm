
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import type { User } from '@/lib/types';
import { query } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function GET() {
  try {
    const sql = 'SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users ORDER BY name ASC';
    const usersDataDb = await query<User[]>(sql);

    const users: User[] = usersDataDb.map((dbUser) => ({
      id: String(dbUser.id || ''),
      name: dbUser.name || '',
      email: dbUser.email || '',
      designation: dbUser.designation || '',
      avatarUrl: dbUser.avatarUrl || undefined,
      websiteUrl: dbUser.websiteUrl || undefined,
      status: dbUser.status || 'Active',
    }));

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API GET /api/users] Error fetching users:', error);
    return NextResponse.json({ message: `Failed to fetch users: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newUser = await request.json() as User;

    if (!newUser.id || !newUser.name || !newUser.email || !newUser.designation || !newUser.password) {
      return NextResponse.json({ message: 'Missing required user fields' }, { status: 400 });
    }

    const existingUserCheck = await query<User[]>('SELECT id FROM users WHERE id = ? OR email = ?', [newUser.id, newUser.email]);
    if (existingUserCheck.length > 0) {
      return NextResponse.json({ message: 'User with this ID or email already exists.' }, { status: 409 });
    }

    const hashedPassword = await hash(newUser.password, 10);

    const result = await query<{ affectedRows: number }>(
      'INSERT INTO users (id, name, email, designation, avatarUrl, websiteUrl, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newUser.id, newUser.name, newUser.email, newUser.designation, newUser.avatarUrl || null,
        newUser.websiteUrl || null, newUser.status || 'Active', hashedPassword,
      ]
    );

    if (result.affectedRows === 1) {
      const createdUserQuery = await query<User[]>('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [newUser.id]);
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
