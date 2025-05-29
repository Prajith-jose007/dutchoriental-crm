
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const usersData: any[] = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users ORDER BY name ASC');
    const users: User[] = usersData.map((user: any) => ({
      ...user,
      // Ensure any type conversions if necessary, e.g., for status if it's stored differently
    }));
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newUser = await request.json() as Omit<User, 'id'> & { id?: string };

    if (!newUser.id || !newUser.name || !newUser.email || !newUser.designation) {
      return NextResponse.json({ message: 'Missing required user fields (id, name, email, designation)' }, { status: 400 });
    }

    // Check if user with this ID or email already exists
    const existingUserCheck: any = await query('SELECT id FROM users WHERE id = ? OR email = ?', [newUser.id, newUser.email]);
    if (existingUserCheck.length > 0) {
      return NextResponse.json({ message: 'User with this ID or email already exists.' }, { status: 409 });
    }
    
    // IMPORTANT: Password should be hashed here in a real application before storing
    const result: any = await query(
      'INSERT INTO users (id, name, email, designation, avatarUrl, websiteUrl, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newUser.id,
        newUser.name,
        newUser.email,
        newUser.designation,
        newUser.avatarUrl || null,
        newUser.websiteUrl || null,
        newUser.status || 'Active',
        newUser.password || null, // Storing plaintext if provided, NULL otherwise
      ]
    );

    if (result.affectedRows === 1) {
      // Fetch the created user to return it (excluding password)
      const createdUserQuery: any = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [newUser.id]);
      if (createdUserQuery.length > 0) {
        return NextResponse.json(createdUserQuery[0] as User, { status: 201 });
      }
      // Fallback if fetch fails, return input minus password
      const { password, ...userToReturn } = newUser;
      return NextResponse.json(userToReturn as User, { status: 201 });
    } else {
       throw new Error('Failed to insert user into database');
    }
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ message: 'Failed to create user', error: (error as Error).message }, { status: 500 });
  }
}
