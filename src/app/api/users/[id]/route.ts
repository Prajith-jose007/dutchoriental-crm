
// src/app/api/users/[id]/route.ts
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[API GET /api/users/${id}] Received request`);
    const userDataDb: any = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [id]);
    
    if (userDataDb.length > 0) {
      const dbUser = userDataDb[0];
      const user: User = { 
        id: String(dbUser.id || ''),
        name: dbUser.name || '', 
        email: dbUser.email || '', 
        designation: dbUser.designation || '', 
        avatarUrl: dbUser.avatarUrl || undefined,
        websiteUrl: dbUser.websiteUrl || undefined,
        status: dbUser.status || 'Active',
      };
      console.log(`[API GET /api/users/${id}] User found:`, user);
      return NextResponse.json(user, { status: 200 });
    } else {
      console.log(`[API GET /api/users/${id}] User not found.`);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`[API GET /api/users/${params.id}] Error:`, error);
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
    console.log(`[API PUT /api/users/${id}] Received updatedUser data:`, updatedUser);


    const existingUserResult: any = await query('SELECT email FROM users WHERE id = ?', [id]);
    if (existingUserResult.length === 0) {
      console.log(`[API PUT /api/users/${id}] User not found for update.`);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const existingUserEmail = existingUserResult[0].email;

    // Check for email conflict if email is being changed
    if (updatedUser.email && updatedUser.email.toLowerCase() !== existingUserEmail.toLowerCase()) {
      const userByEmail: any = await query('SELECT id FROM users WHERE email = ? AND id != ?', [updatedUser.email, id]);
      if (userByEmail.length > 0) {
        console.warn(`[API PUT /api/users/${id}] Email conflict: ${updatedUser.email} already exists.`);
        return NextResponse.json({ message: `User with email ${updatedUser.email} already exists.` }, { status: 409 });
      }
    }
    
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    // Do not allow 'id' to be updated. Password handled specially.
    const allowedKeys: (keyof Omit<User, 'id'>)[] = ['name', 'email', 'designation', 'avatarUrl', 'websiteUrl', 'status', 'password'];
    
    allowedKeys.forEach(key => {
      if (updatedUser[key] !== undefined) {
        if (key === 'password') {
          if (typeof updatedUser.password === 'string' && updatedUser.password.length > 0) {
            // IMPORTANT: Password should be hashed here in a real application
            fieldsToUpdate.push(`password = ?`);
            values.push(updatedUser.password);
          }
          // If password is empty string or not provided, we don't update it
        } else {
          fieldsToUpdate.push(`${key} = ?`);
          values.push(updatedUser[key] === '' && (key === 'avatarUrl' || key === 'websiteUrl') ? null : updatedUser[key]);
        }
      }
    });

    if (fieldsToUpdate.length === 0) {
      console.log(`[API PUT /api/users/${id}] No valid fields to update.`);
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }

    const setClause = fieldsToUpdate.join(', ');
    values.push(id); // For the WHERE clause
    
    console.log(`[API PUT /api/users/${id}] SQL: UPDATE users SET ${setClause} WHERE id = ?`, 'Params:', values);
    const result: any = await query(`UPDATE users SET ${setClause} WHERE id = ?`, values);
    console.log(`[API PUT /api/users/${id}] DB Update Result:`, result);
    
    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/users/${id}] User not found during update or no changes made.`);
       // It's possible no data changed, so a 200 with the current data might still be okay.
       // Or, if you require changes, this could be a 304 or 404.
       // Fetching and returning current data is safer.
    }
    
    const finalUpdatedUserQuery: any = await query('SELECT id, name, email, designation, avatarUrl, websiteUrl, status FROM users WHERE id = ?', [id]);
    if (finalUpdatedUserQuery.length > 0) {
      console.log(`[API PUT /api/users/${id}] Successfully updated user.`);
      return NextResponse.json(finalUpdatedUserQuery[0] as User, { status: 200 });
    }
    console.error(`[API PUT /api/users/${id}] User updated, but failed to fetch confirmation.`);
    return NextResponse.json({ message: 'User updated, but failed to fetch confirmation.' }, { status: 200 }); // Or 500

  } catch (error) {
    console.error(`[API PUT /api/users/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to update user', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[API DELETE /api/users/${id}] Attempting to delete user.`);
    const result: any = await query('DELETE FROM users WHERE id = ?', [id]);
    console.log(`[API DELETE /api/users/${id}] DB Delete Result:`, result);
    
    if (result.affectedRows === 0) {
      console.warn(`[API DELETE /api/users/${id}] User not found for deletion.`);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log(`[API DELETE /api/users/${id}] Successfully deleted user.`);
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API DELETE /api/users/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to delete user', error: (error as Error).message }, { status: 500 });
  }
}
