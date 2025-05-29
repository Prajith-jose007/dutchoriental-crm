
// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const userData: any = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [id]);
    
    if (userData.length > 0) {
      const user: User = { ...userData[0] };
      return NextResponse.json(user, { status: 200 });
    } else {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch user ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedUser = await request.json() as Partial<User>;

    const existingUserResult: any = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUserResult.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const existingUser = existingUserResult[0];

    // Check for email conflict if email is being changed
    if (updatedUser.email && updatedUser.email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const userByEmail: any = await query('SELECT id FROM users WHERE email = ? AND id != ?', [updatedUser.email, id]);
      if (userByEmail.length > 0) {
        return NextResponse.json({ message: `User with email ${updatedUser.email} already exists.` }, { status: 409 });
      }
    }
    
    let setClause = '';
    const values = [];
    const allowedKeys: (keyof User)[] = ['name', 'email', 'designation', 'avatarUrl', 'websiteUrl', 'status', 'password'];
    
    for (const key of allowedKeys) {
      if (updatedUser[key] !== undefined) {
        // Special handling for password: only update if a new password is provided and not empty
        if (key === 'password') {
          if (typeof updatedUser.password === 'string' && updatedUser.password.length > 0) {
            // IMPORTANT: Password should be hashed here in a real application
            setClause += `${key} = ?, `;
            values.push(updatedUser.password);
          }
          // If password is empty or not provided, we don't update it
        } else {
          setClause += `${key} = ?, `;
          values.push(updatedUser[key] === '' && (key === 'avatarUrl' || key === 'websiteUrl') ? null : updatedUser[key]);
        }
      }
    }

    if (values.length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }

    setClause = setClause.slice(0, -2); // Remove trailing comma and space
    values.push(id); // For the WHERE clause
    
    const result: any = await query(`UPDATE users SET ${setClause} WHERE id = ?`, values);
    
    if (result.affectedRows === 0) {
       return NextResponse.json({ message: 'User not found during update or no changes made' }, { status: 404 });
    }
    
    // Fetch the updated user to return it (excluding password)
    const finalUpdatedUserQuery: any = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [id]);
     if (finalUpdatedUserQuery.length > 0) {
        return NextResponse.json(finalUpdatedUserQuery[0] as User, { status: 200 });
      }
      return NextResponse.json({ message: 'User updated, but failed to fetch confirmation.' }, { status: 200 });


  } catch (error) {
    console.error(`Failed to update user ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update user', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const result: any = await query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete user ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete user', error: (error as Error).message }, { status: 500 });
  }
}
