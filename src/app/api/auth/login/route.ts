import { NextResponse, type NextRequest } from 'next/server';
import { query } from '@/lib/db';
import type { User } from '@/lib/types';
import { compare } from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
        }

        // Find the user by email
        const sql = 'SELECT id, name, email, designation, avatarUrl, websiteUrl, status, password FROM users WHERE email = ? LIMIT 1';
        const usersDataDb = (await query<User[]>(sql, [email]));

        if (usersDataDb.length === 0) {
            return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
        }

        const dbUser = usersDataDb[0];

        // Verify password using bcrypt
        const isPasswordValid = await compare(password, dbUser.password || '');
        if (!isPasswordValid) {
            return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
        }

        // Determine role
        const role = dbUser.designation === 'System Administrator' || dbUser.designation === 'Admin' ? 'admin' : 'user';

        // Return user info (excluding password)
        const userInfo = {
            id: String(dbUser.id),
            name: dbUser.name,
            email: dbUser.email,
            designation: dbUser.designation,
            role: role,
        };

        return NextResponse.json(userInfo, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('[API POST /api/auth/login] Login error:', error);
        return NextResponse.json({ message: `Login failed: ${errorMessage}` }, { status: 500 });
    }
}
