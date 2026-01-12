
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatToMySQLDateTime } from '@/lib/utils';

/**
 * Webhook endpoint for LotusYacht.com (WordPress) 
 * Can be used with plugins like "Webhook for Contact Form 7" or similar.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Extract fields from WordPress form body
        // Common WP form field names: your-name, your-email, your-phone, your-subject, your-message
        // Or custom ones like trip-date, pax

        const clientName = body['your-name'] || body['name'] || 'Unknown';
        const email = body['your-email'] || body['email'] || '';
        const phone = body['your-phone'] || body['phone'] || '';
        const subject = body['your-subject'] || body['interest'] || 'Website Inquiry';
        const message = body['your-message'] || body['message'] || '';
        const preferredDate = body['trip-date'] || body['date'] || null;
        const paxCount = parseInt(body['pax'] || body['guests'] || '0');

        const id = `SL-WP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const sql = `
          INSERT INTO sales_leads (
            id, clientName, email, phone, subject, message, source, status, priority, 
            preferredDate, paxCount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            id, clientName, email, phone, subject, message, 'Website (LotusYacht)',
            'New', 'Medium',
            preferredDate ? formatToMySQLDateTime(new Date(preferredDate)) : null,
            paxCount
        ];

        await query(sql, params);

        return NextResponse.json({ message: 'Webhook received and lead created', id }, { status: 201 });
    } catch (error) {
        console.error('[WP Webhook Error]', error);
        return NextResponse.json({ message: 'Error processing webhook' }, { status: 500 });
    }
}
