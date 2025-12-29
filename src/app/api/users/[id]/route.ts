
// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/lib/types';
import { query } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const userDataDb = await query<User[]>('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [id]);

    if (userDataDb.length > 0) {
      const user: User = userDataDb[0];
      return NextResponse.json(user, { status: 200 });
    } else {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API GET /api/users] Error:`, error);
    return NextResponse.json({ message: `Failed to fetch user: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'User ID is required for update' }, { status: 400 });
  }

  try {
    const updatedUser = await request.json() as Partial<User>;

    const existingUserResult = await query<User[]>('SELECT email FROM users WHERE id = ?', [id]);
    if (existingUserResult.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const existingUserEmail = existingUserResult[0].email;

    if (updatedUser.email && updatedUser.email.toLowerCase() !== existingUserEmail.toLowerCase()) {
      const userByEmail = await query<User[]>('SELECT id FROM users WHERE email = ? AND id != ?', [updatedUser.email, id]);
      if (userByEmail.length > 0) {
        return NextResponse.json({ message: `User with email ${updatedUser.email} already exists.` }, { status: 409 });
      }
    }

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    const allowedKeys: (keyof Omit<User, 'id'>)[] = ['name', 'email', 'designation', 'avatarUrl', 'websiteUrl', 'status', 'password'];

    for (const key of allowedKeys) {
      const val = updatedUser[key];
      if (val !== undefined) {
        if (key === 'password') {
          if (typeof val === 'string' && val.length > 0) {
            const hashedPassword = await hash(val, 10);
            fieldsToUpdate.push(`password = ?`);
            values.push(hashedPassword);
          }
        } else {
          fieldsToUpdate.push(`${key} = ?`);
          values.push(val === '' && (key === 'avatarUrl' || key === 'websiteUrl') ? null : val);
        }
      }
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }

    const setClause = fieldsToUpdate.join(', ');
    values.push(id);

    await query<{ affectedRows: number }>(`UPDATE users SET ${setClause} WHERE id = ?`, values);

    const finalUpdatedUserQuery = await query<User[]>('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [id]);
    if (finalUpdatedUserQuery.length > 0) {
      return NextResponse.json(finalUpdatedUserQuery[0] as User, { status: 200 });
    }
    return NextResponse.json({ message: 'User updated, but failed to fetch confirmation.' }, { status: 500 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API PUT /api/users] Error:`, error);
    return NextResponse.json({ message: `Failed to update user: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'User ID is required for deletion' }, { status: 400 });
  }

  try {
    const result = await query<{ affectedRows: number }>('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API DELETE /api/users] Error:`, error);
    return NextResponse.json({ message: `Failed to delete user: ${errorMessage}` }, { status: 500 });
  }
}
