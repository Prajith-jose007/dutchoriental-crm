
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Lead, LeadPackageQuantity } from '@/lib/types';
import { formatToMySQLDateTime } from '@/lib/utils';
import { formatISO, parseISO, isValid } from 'date-fns';

/**
 * WooCommerce Webhook Endpoint
 * 
 * To use: 
 * 1. Go to WooCommerce > Settings > Advanced > Webhooks
 * 2. Add New Webhook
 * 3. Topic: Order Created (or Order Updated)
 * 4. Delivery URL: https://[your-domain]/api/webhooks/woocommerce
 * 5. Secret: [Any secret you choose]
 * 6. API Version: WP REST API v3
 */

const YACHT_MAPPING: Record<string, string> = {
    'Lotus': 'DO-yacht-lotus',
    'Ocean Empress': 'DO-yacht-ocean',
    'Mansour': 'AL MANSOUR ',
    'Calypso': 'CALYPSO SUNSET',
    'Superyacht': 'DO-yacht-super',
    'Rose Royale': 'ROSE ROYALE'
};

const PACKAGE_NAME_MAPPING: Record<string, string> = {
    'Adult': 'ADULT',
    'Child': 'CHILD',
    'Adult ALC': 'ADULT ALC',
    'VIP Adult': 'VIP ADULT',
    'VIP Child': 'VIP CHILD',
    'VIP Adult ALC': 'VIP ADULT ALC',
    'Royal Adult': 'ROYAL ADULT',
    'Royal Child': 'ROYAL CHILD'
};

export async function GET() {
    return NextResponse.json({ message: 'WooCommerce Webhook Endpoint is Active' }, { status: 200 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // WooCommerce Order Status Mapping
        const wcStatus = body.status;
        let crmStatus: any = 'Unconfirmed';
        if (wcStatus === 'processing' || wcStatus === 'completed') {
            crmStatus = 'Confirmed';
        } else if (wcStatus === 'cancelled' || wcStatus === 'failed') {
            crmStatus = 'Lost';
        }

        const orderId = body.id;
        const clientName = `${body.billing?.first_name || ''} ${body.billing?.last_name || ''}`.trim() || 'Online Customer';
        const email = body.billing?.email || '';
        const phone = body.billing?.phone || '';
        const totalAmount = parseFloat(body.total || '0');
        const paymentMethod = body.payment_method_title || 'Online';
        const transactionId = body.transaction_id || `WC-${orderId}`;

        // Extract Booking Details from Line Items
        let eventDate: Date | null = null;
        let yachtId = 'DO-yacht-lotus'; // Default
        const packageQuantities: LeadPackageQuantity[] = [];

        if (body.line_items && Array.isArray(body.line_items)) {
            for (const item of body.line_items) {
                const productName = item.name || '';

                // Try to detect Yacht from product name
                for (const [key, id] of Object.entries(YACHT_MAPPING)) {
                    if (productName.toLowerCase().includes(key.toLowerCase())) {
                        yachtId = id;
                        break;
                    }
                }

                // Try to detect Date from item metadata
                if (item.meta_data && Array.isArray(item.meta_data)) {
                    for (const meta of item.meta_data) {
                        const label = String(meta.display_key || meta.key).toLowerCase();
                        if (label.includes('booking date') || label.includes('date')) {
                            const parsed = new Date(meta.display_value || meta.value);
                            if (isValid(parsed)) eventDate = parsed;
                        }
                    }
                }

                // Map to package
                let detectedPackageName = 'ADULT'; // Fallback
                for (const [key, internalName] of Object.entries(PACKAGE_NAME_MAPPING)) {
                    if (productName.toLowerCase().includes(key.toLowerCase())) {
                        detectedPackageName = internalName;
                        break;
                    }
                }

                packageQuantities.push({
                    packageId: `pq-${item.id}`,
                    packageName: detectedPackageName,
                    quantity: parseInt(item.quantity || '0'),
                    rate: parseFloat(item.price || '0')
                });
            }
        }

        if (!eventDate) eventDate = new Date(); // Fallback to today if not found

        // Generate Lead ID
        const existingLeads = await query<any[]>('SELECT id FROM leads WHERE id LIKE "DO-%"');
        const prefix = "DO-";
        let maxNum = 100;
        existingLeads.forEach(l => {
            if (l.id && l.id.startsWith(prefix)) {
                const numPart = parseInt(l.id.substring(prefix.length), 10);
                if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
            }
        });
        const leadId = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;

        // Check for existing order to avoid duplicates
        const existingOrder = await query<any[]>('SELECT id FROM leads WHERE bookingRefNo = ?', [String(orderId)]);
        if (existingOrder.length > 0) {
            return NextResponse.json({ message: 'Order already synced', id: existingOrder[0].id });
        }

        const now = new Date();
        const sql = `
            INSERT INTO leads (
                id, clientName, agent, yacht, status, month, notes, type, 
                paymentConfirmationStatus, transactionId, bookingRefNo, modeOfPayment,
                package_quantities_json, totalAmount, commissionPercentage, commissionAmount, 
                netAmount, paidAmount, balanceAmount, createdAt, updatedAt, 
                customerEmail, customerPhone, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            leadId,
            clientName,
            'DO-ONLINE', // Online Agent ID or Marker
            yachtId,
            crmStatus,
            formatToMySQLDateTime(eventDate),
            `WooCommerce Order #${orderId}. Payment: ${paymentMethod}`,
            'Shared Cruise',
            'CONFIRMED',
            transactionId,
            String(orderId),
            paymentMethod,
            JSON.stringify(packageQuantities),
            totalAmount,
            0, 0, // No commission for online direct
            totalAmount, totalAmount, 0, // Paid in full online
            formatToMySQLDateTime(now),
            formatToMySQLDateTime(now),
            email,
            phone,
            'Website (WooCommerce)'
        ];

        await query(sql, params);

        return NextResponse.json({
            message: 'WooCommerce Order Synced',
            leadId,
            clientName,
            orderId
        }, { status: 201 });

    } catch (error) {
        console.error('[WooCommerce Webhook Error]', error);
        return NextResponse.json({ message: 'Error processing WooCommerce webhook' }, { status: 500 });
    }
}
