
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns'; // For date consistency if needed

// Helper to ensure date strings are in a consistent format (if users had date fields)
const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    if (isValid(dateString)) return formatISO(dateString);
    return null;
  }
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return formatISO(parsed);
    return dateString; 
  } catch {
    return dateString;
  }
};


export async function GET(request: NextRequest) {
  console.log('[API GET /api/users] Received request');
  try {
    const usersDataDb: any[] = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users ORDER BY name ASC');
    console.log('[API GET /api/users] Raw DB Data (length):', usersDataDb.length);
    if (usersDataDb.length > 0) {
        console.log('[API GET /api/users] Raw DB Data Sample (first item):', usersDataDb[0]);
    }

    const users: User[] = usersDataDb.map((dbUser: any) => {
      const userTyped: User = {
        id: String(dbUser.id || ''),
        name: dbUser.name || '', 
        email: dbUser.email || '', 
        designation: dbUser.designation || '', 
        avatarUrl: dbUser.avatarUrl || undefined,
        websiteUrl: dbUser.websiteUrl || undefined,
        status: dbUser.status || 'Active',
        // password field is intentionally omitted for GET requests
      };
      return userTyped;
    });
    
    console.log('[API GET /api/users] Mapped Users Data (length):', users.length);
     if (users.length > 0) {
        console.log('[API GET /api/users] Mapped Users Data Sample (first item):', users[0]);
    }
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/users] Error in GET handler:', error);
    let errorMessage = 'An unknown error occurred while fetching users.';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        errorMessage = (error as any).message;
    }
    return NextResponse.json(
      { message: 'Failed to fetch users. Check server logs for details.', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newUser = await request.json() as User; // Expect full User object
    console.log('[API POST /api/users] Received newUser:', newUser);

    if (!newUser.id || !newUser.name || !newUser.email || !newUser.designation) {
      console.error('[API POST /api/users] Validation Error: Missing required fields.');
      return NextResponse.json({ message: 'Missing required user fields (id, name, email, designation)' }, { status: 400 });
    }
    // Password is required for new users as per UserFormDialog logic
    if (!newUser.password) {
        console.error('[API POST /api/users] Validation Error: Password is required for new users.');
        return NextResponse.json({ message: 'Password is required for new users.' }, { status: 400 });
    }


    const existingUserCheck: any = await query('SELECT id FROM users WHERE id = ? OR email = ?', [newUser.id, newUser.email]);
    if (existingUserCheck.length > 0) {
      console.warn(`[API POST /api/users] Conflict: User with ID ${newUser.id} or email ${newUser.email} already exists.`);
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
        newUser.password, // Store password (in real app, this MUST be hashed)
      ]
    );
    console.log('[API POST /api/users] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      // Fetch the created user to return it (excluding password)
      const createdUserQuery: any = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [newUser.id]);
      if (createdUserQuery.length > 0) {
        console.log(`[API POST /api/users] Successfully created user: ${newUser.id}`);
        return NextResponse.json(createdUserQuery[0] as User, { status: 201 });
      }
      // Fallback if fetch fails, return input data (minus password)
      const { password, ...userToReturn } = newUser;
      console.warn('[API POST /api/users] User inserted, but failed to fetch confirmation. Returning original payload (minus password).');
      return NextResponse.json(userToReturn as User, { status: 201 });
    } else {
       console.error('[API POST /api/users] Database insert failed, affectedRows was not 1.');
       throw new Error('Failed to insert user into database');
    }
  } catch (error) {
    console.error('[API POST /api/users] Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to create user', error: errorMessage }, { status: 500 });
  }
}
