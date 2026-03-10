'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import type { Lead } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Printer, MessageCircle, Mail, X } from 'lucide-react';

export function TicketDialog({
    isOpen,
    onOpenChange,
    lead,
    yachtName
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    lead: Lead | null;
    yachtName: string;
}) {
    if (!lead) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('ticket-area-to-print');
        if (!printContent) return;
        const printWindow = window.open('', '_blank', 'width=600,height=800');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Boarding Pass</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; display: flex; justify-content: center; }
                        .ticket { border: 2px solid #ccc; border-radius: 12px; width: 400px; max-width: 100%; overflow: hidden; padding-bottom: 20px; }
                        .header { background: #B2904C; padding: 16px; text-align: center; color: white; font-weight: bold; text-transform: uppercase; font-size: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .content { padding: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 15px; }
                        .title { color: #B2904C; font-weight: bold; text-transform: uppercase; font-size: 14px; margin: 0; }
                        .code { font-size: 24px; font-weight: bold; margin: 5px 0 15px 0; }
                        .details { text-align: left; width: 100%; border: 1px solid #eee; border-radius: 8px; padding: 15px; box-sizing: border-box; }
                        .row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px; }
                        .row:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
                        .label { color: #666; font-size: 14px; }
                        .value { font-weight: bold; font-size: 14px; }
                        .guest-val { font-size: 18px; }
                        .qr-container { padding: 16px; border: 1px solid #eee; border-radius: 12px; margin-top: 10px; }
                        .footer { font-size: 11px; color: #888; text-transform: uppercase; margin-top: 10px; }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div class="ticket">
                        <div class="header">Dutch Oriental</div>
                        <div class="content">
                            <p class="title">Boarding Pass</p>
                            <h3 class="code">${codeStr}</h3>
                            <div class="details">
                                <div class="row"><span class="label">Guest Name</span> <span class="value">${lead.clientName}</span></div>
                                <div class="row"><span class="label">Date & Time</span> <span class="value">${formattedDate}</span></div>
                                <div class="row"><span class="label">Cruise / Yacht</span> <span class="value">${yachtName || lead.yacht}</span></div>
                                <div class="row"><span class="label">Total Guests</span> <span class="value guest-val">${guests} Guests</span></div>
                            </div>
                            <div class="qr-container">
                                ${document.getElementById('ticket-qr-code')?.innerHTML || ''}
                            </div>
                            <p class="footer">Please present QR Code at Boarding</p>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const codeStr = lead.transactionId || lead.id;
    const formattedDate = lead.month ? format(parseISO(lead.month), 'dd MMM yyyy, hh:mm a') : 'TBD';
    const guests = (lead.packageQuantities?.reduce((acc, curr) => acc + curr.quantity, 0) || 0) + (Number(lead.freeGuestCount) || 0);

    const handleWhatsApp = () => {
        const text = `Hi ${lead.clientName},\n\nHere is your booking confirmation.\n\nTicket Code: *${codeStr}*\nDate: ${formattedDate}\nCruise: ${yachtName || lead.yacht}\nGuests: ${guests}\n\nPlease show this code upon arrival to check in.\nThank you!`;
        const phone = lead.customerPhone ? lead.customerPhone.replace(/[^0-9]/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleEmail = () => {
        const text = `Hi ${lead.clientName},\n\nHere is your booking confirmation.\n\nTicket Code: ${codeStr}\nDate: ${formattedDate}\nCruise: ${yachtName}\nGuests: ${guests}\n\nPlease show this code upon arrival to check in.\n\nThank you!`;
        window.open(`mailto:${lead.customerEmail || ''}?subject=Booking Confirmation - ${codeStr}&body=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md print:hidden bg-slate-50">
                <DialogHeader className="print:hidden">
                    <DialogTitle>Booking E-Ticket</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    {/* Ticket preview */}
                    <div
                        id="ticket-area-to-print"
                        className="border-2 border-slate-200 rounded-xl bg-white shadow-xl flex flex-col items-center gap-2 overflow-hidden relative"
                    >
                        {/* Header portion */}
                        <div className="bg-[#B2904C] w-full py-4 text-center">
                            <h2 className="text-xl font-bold uppercase tracking-widest text-white">Dutch Oriental</h2>
                        </div>

                        <div className="px-6 py-4 w-full flex flex-col items-center gap-4">
                            <div className="text-center space-y-1">
                                <p className="text-sm font-semibold uppercase text-[#B2904C]">Boarding Pass</p>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{codeStr}</h3>
                            </div>

                            <div className="w-full space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm shadow-inner">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-slate-500 font-medium">Guest Name</span>
                                    <span className="font-bold text-slate-800 text-right">{lead.clientName}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-slate-500 font-medium">Date & Time</span>
                                    <span className="font-bold text-slate-800 text-right">{formattedDate}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-slate-500 font-medium">Cruise / Yacht</span>
                                    <span className="font-bold text-slate-800 text-right">{yachtName || lead.yacht}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Total Guests</span>
                                    <span className="font-bold text-slate-800 text-right text-lg">{guests} Guests</span>
                                </div>
                            </div>

                            <div id="ticket-qr-code" className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm mt-2">
                                <QRCodeSVG value={codeStr} size={160} level="M" includeMargin={true} />
                            </div>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider text-center">Please present QR Code at Boarding</p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center w-full print:hidden">
                        <Button onClick={handlePrint} variant="outline" className="flex-1 border-[#B2904C] text-[#B2904C] hover:bg-[#B2904C] hover:text-white font-bold transition-colors">
                            <Printer className="w-4 h-4 mr-2" /> Print Ticket
                        </Button>
                        <Button onClick={handleWhatsApp} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold transition-colors">
                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                        </Button>
                        <Button onClick={handleEmail} variant="default" className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors">
                            <Mail className="w-4 h-4 mr-2" /> Email
                        </Button>
                    </div>
                </div>
            </DialogContent>

        </Dialog>
    );
}
