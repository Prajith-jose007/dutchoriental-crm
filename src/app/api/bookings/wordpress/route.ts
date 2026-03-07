import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, LeadType, ModeOfPayment, LeadPackageQuantity } from '@/lib/types';
import { applyPackageTypeDetection } from '@/lib/csvHelpers';

// Helper to construct Basic Auth header
const getAuthHeader = () => {
    const ck = process.env.WC_CONSUMER_KEY;
    const cs = process.env.WC_CONSUMER_SECRET;
    if (!ck || !cs) return null;
    return `Basic ${Buffer.from(`${ck}:${cs}`).toString('base64')}`;
};

export async function GET(request: NextRequest) {
    try {
        const authHeader = getAuthHeader();
        const wpUrl = process.env.WORDPRESS_API_URL;

        if (!authHeader || !wpUrl) {
            return NextResponse.json(
                { message: 'WordPress API credentials or URL not configured.' },
                { status: 500 }
            );
        }

        // Fetch orders from WooCommerce (processing and completed)
        // We fetch a reasonable limit, say 50 or 100 recent orders.
        // If the user needs more, we can add pagination later or query params.
        const endpoint = `${wpUrl}/wp-json/wc/v3/orders?per_page=50&status=processing,completed`;

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { message: `Failed to fetch orders from WordPress: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const orders = await response.json();
        const mappedLeads: Lead[] = [];

        for (const order of orders) {
            // Map basic fields
            const clientName = `${order.billing.first_name} ${order.billing.last_name}`.trim() || 'Unknown Client';
            const email = order.billing.email;
            const phone = order.billing.phone;

            const transactionId = `WC-${order.id}`; // Prefix to avoid collision or denote checking system

            // Determine status
            let leadStatus: LeadStatus = 'Balance';
            if (order.status === 'completed') leadStatus = 'Completed';
            else if (order.status === 'processing') leadStatus = 'Confirmed';
            else if (order.status === 'cancelled' || order.status === 'failed') leadStatus = 'Canceled';

            // Calculate totals
            const totalAmount = parseFloat(order.total) || 0;
            // const totalTax = parseFloat(order.total_tax) || 0;

            // Map items to packages
            // We process each line item as if it were a CSV row to leverage existing logic,
            // or we construct the package quantities directly if simple.
            // Since existing logic handles "Yacht Name - Package Type" parsing, we try to use that.

            // One order might have multiple items. 
            // Existing system seems to treat one 'booking' as one lead. 
            // If an order has multiple different yachts, it might need splitting?
            // For now, let's assume one yacht per order or aggregate into one Lead.
            // If multiple yachts, we might take the first one found or create multiple leads?
            // 'BookingsPage' handles one lead = one row.
            // If user bought "Lotus Royale" AND "Desert Rose", that's likely two bookings.
            // However, usually online bookings are simple. Let's try to map to ONE lead first.

            // We will perform package detection on EACH item and aggregate.

            const combinedPackageQuantities: Record<string, { qty: number, total: number }> = {};
            let detectedYachtName = 'Unknown Yacht';
            let detectedYachtSet = false;

            for (const item of order.line_items) {
                const quantity = item.quantity;
                const totalLineParams = parseFloat(item.total) || 0;
                const productName = item.name;

                const lowerName = productName.toLowerCase();
                const isChild = lowerName.includes('child') || lowerName.includes('kid') || lowerName.includes('junior') || lowerName.includes('infant') || lowerName.includes('baby');

                const productId = item.product_id;

                // ID-based Yacht Mapping
                let forcedYachtName = '';
                if ([3302, 21378].includes(productId)) {
                    forcedYachtName = 'Lotus Royale';
                } else if ([21417, 4835].includes(productId)) {
                    forcedYachtName = 'Ocean Empress';
                }

                const mockRow: any = {
                    yacht: forcedYachtName || productName,
                    pkg_adult: isChild ? 0 : quantity,
                    pkg_child: isChild ? quantity : 0,
                };

                // Pass productName as context for parsing (e.g. VIP, Top Deck keywords)
                // We pre-filled yacht above, so helper sees it.
                applyPackageTypeDetection(productName, mockRow, 'RUZINN');

                // Re-force yacht name if ID matched
                if (forcedYachtName) {
                    mockRow.yacht = forcedYachtName;
                }

                if (!detectedYachtSet && mockRow.yacht && mockRow.yacht !== 'Unknown Yacht') {
                    detectedYachtName = mockRow.yacht;
                    detectedYachtSet = true;
                }

                Object.keys(mockRow).forEach(key => {
                    if (key.startsWith('pkg_') && typeof mockRow[key] === 'number' && mockRow[key] > 0) {
                        const internalKey = key;
                        const qty = mockRow[key];
                        // Note: If applyPackageTypeDetection split 1 item into multiple packages (unlikely for WP line items usually),
                        // we might need to distribute price.
                        // Assuming 1 item -> 1 package type dominant.
                        // If it split (e.g. 1 adult 1 child), we simple divide total by total qty?
                        // Or just assign to the first one found?
                        // Let's assume total goes to the package bucket.

                        const readableName = internalKey.substring(4).replace(/_/g, ' ').toUpperCase();

                        if (!combinedPackageQuantities[readableName]) {
                            combinedPackageQuantities[readableName] = { qty: 0, total: 0 };
                        }
                        combinedPackageQuantities[readableName].qty += qty;
                        // Use item total for this package bucket. 
                        // If multiple packages derived from single item, price distribution is tricky.
                        // But usually ApplyPackageTypeDetection moves 'adult' to 'vip adult'. It doesn't usually multiply rows.
                        combinedPackageQuantities[readableName].total += totalLineParams;
                    }
                });
            }

            // Construct PackageQuantities Array
            const packageQuantities: LeadPackageQuantity[] = Object.entries(combinedPackageQuantities).map(([name, data]) => ({
                packageId: 'temp-id',
                packageName: name,
                quantity: data.qty,
                rate: data.qty > 0 ? (data.total / data.qty) : 0
            }));

            // Create Lead
            const lead: Lead = {
                id: `temp-wp-${order.id}`, // Temporary ID
                clientName,
                customerEmail: email,
                customerPhone: phone,
                status: leadStatus,
                month: order.date_created, // or date_modified
                notes: `Imported from WordPress Order #${order.id}. ` + (order.customer_note || ''),
                yacht: detectedYachtName, // String name, frontend will resolve ID
                type: 'Dinner Cruise', // Default?
                paymentConfirmationStatus: order.date_paid ? 'CONFIRMED' : 'UNCONFIRMED',
                transactionId,
                bookingRefNo: `DO-WP-${order.id}`,
                modeOfPayment: 'CARD', // Default for online WP orders
                packageQuantities,
                freeGuestCount: 0,
                totalAmount,
                commissionPercentage: 0,
                netAmount: totalAmount,
                paidAmount: leadStatus === 'Completed' || leadStatus === 'Confirmed' ? totalAmount : 0,
                balanceAmount: 0,
                createdAt: order.date_created,
                updatedAt: order.date_modified,
                agent: 'Direct / Website', // Default agent?
                source: 'Website',
            };

            mappedLeads.push(lead);
        }

        return NextResponse.json(mappedLeads);

    } catch (error) {
        console.error('Error in WordPress API route:', error);
        return NextResponse.json(
            { message: 'Internal Server Error processing WordPress orders.', error: String(error) },
            { status: 500 }
        );
    }
}
