
'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';

interface QrScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
    const [headerText, setHeaderText] = useState("Initializing Camera...");
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        // Use a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, []);

    const startScanner = async () => {
        // Security Check for Camera Access
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            console.warn("Camera access blocked: Your connection is not secure (HTTP).");
            setHasPermission(false);
            setHeaderText("Insecure Connection (No Camera)");
            return;
        }

        try {
            const tempScanner = new Html5Qrcode("reader");
            scannerRef.current = tempScanner;

            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
                setHasPermission(true);
                // Use the back camera preferably
                const cameraId = cameras.length > 1 ? cameras[1].id : cameras[0].id;

                await tempScanner.start(
                    { facingMode: "environment" }, // Prefer back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        if (mountedRef.current) {
                            handleScanSuccess(decodedText);
                        }
                    },
                    (errorMessage) => {
                        // ignore parsing errors
                    }
                );
                if (mountedRef.current) setHeaderText("Scan Ticket QR Code");
            } else {
                if (mountedRef.current) {
                    setHasPermission(false);
                    setHeaderText("No cameras found");
                }
            }
        } catch (err) {
            console.error("Camera start error", err);

            if (mountedRef.current) {
                setHasPermission(false);
                setHeaderText("Permission Denied or Error");
            }
        }
    };

    const handleScanSuccess = async (text: string) => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                console.error("Error stopping scanner", e);
            }
        }
        onScan(text);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg max-w-sm w-full relative overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-semibold text-sm">{headerText}</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-0 relative bg-black aspect-square">
                    <div id="reader" className="w-full h-full"></div>
                    {/* Overlay Guide */}
                    <div className="absolute inset-0 border-2 border-white/20 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-green-400 rounded-lg opacity-50"></div>
                    </div>
                </div>

                <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        Point your camera at the ticket QR code. It will scan automatically.
                    </p>
                    {hasPermission === false && (
                        <p className="text-xs text-red-500 mt-2 font-bold">
                            Camera permission is required. Please check your browser settings.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
