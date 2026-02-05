import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Attempt to add the column
        await query("ALTER TABLE leads ADD COLUMN collectedAtCheckIn DOUBLE DEFAULT 0");
        return NextResponse.json({ success: true, message: "Successfully added column 'collectedAtCheckIn' to 'leads' table." });
    } catch (error: any) {
        // Check if error is because column already exists (Error Code: 1060 or SQLState 42S21 for Duplicate column)
        if (error.code === 'ER_DUP_FIELDNAME' || error.errno === 1060 || error.message?.includes("Duplicate column")) {
            return NextResponse.json({ success: true, message: "Column 'collectedAtCheckIn' already exists. No changes needed." });
        }

        return NextResponse.json({
            success: false,
            message: "Failed to update database.",
            error: error.message
        }, { status: 500 });
    }
}
