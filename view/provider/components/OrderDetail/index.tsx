
import React, { useState, useRef, useEffect } from 'react';
import { ProviderOrder } from '../../../../types';
import { HeaderSection } from './HeaderSection';
import { OrderInfoCard } from './OrderInfoCard';
import { ReceiverInfo } from './ReceiverInfo';
import { CourierInfo } from './CourierInfo';
import { TimelineDetails } from './TimelineDetails';
import { WarningNote } from './WarningNote';
import { ActionBar } from './ActionBar';
import { CheckCircle2, X, Camera, Keyboard, ScanLine, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { db } from '../../../../services/db'; 
import { SuccessVerificationSplash } from '../../../common/SuccessVerificationSplash';
// @ts-ignore
import jsQR from 'https://esm.sh/jsqr@1.4.0';

interface OrderDetailProps {
    order: ProviderOrder;
    onBack: () => void;
    onComplete?: (status?: 'completed' | 'active') => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ order, onBack, onComplete }) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{ status: 'success' | 'error' | 'already_taken' | 'idle', message: string, code?: string, pointsEarned?: number }>({ status: 'idle', message: '' });
    
    const [isScanSuccess, setIsScanSuccess] = useState(order.isScanned || false);
    
    // State for Success Splash Screen
    const [showSuccessSplash, setShowSuccessSplash] = useState(false);
    
    // State for Completion Loading
    const [isCompleting, setIsCompleting] = useState(false);

    const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
    const [manualCode, setManualCode] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | null>(null);

    const handleVerifyCode = async (code: string) => {
        if (!code || isVerifying || verificationResult.status !== 'idle') return;

        setIsVerifying(true);
        
        try {
            const result = await db.verifyOrderQR(code);

            if (result.success) {
                setIsScanSuccess(true);

                setVerificationResult({ 
                    status: 'success', 
                    message: `VERIFIKASI SUKSES! ${result.foodName || 'Makanan'} DITERIMA.`, 
                    code,
                    pointsEarned: result.pointsEarned 
                });
                
                if (navigator.vibrate) navigator.vibrate(200);

                // Jika sukses, biarkan user klik tombol 'Lanjutkan' di modal untuk kembali ke layar detail
            } else {
                if (result.message === 'ALREADY_SCANNED') {
                    setVerificationResult({ 
                        status: 'error', 
                        message: 'QR CODE INI SUDAH DIGUNAKAN SEBELUMNYA.', 
                        code 
                    });
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                } else {
                    throw new Error(result.message || "Kode validasi gagal.");
                }
            }

        } catch (error: any) {
            console.error("Verification failed:", error);
            
            let errorMessage = 'KODE TIDAK VALID ATAU TIDAK DITEMUKAN.';
            let status: 'error' | 'already_taken' = 'error';

            if (error.message.includes("milik pesanan donatur lain")) {
                errorMessage = "QR CODE INI BUKAN UNTUK PESANAN ANDA.";
            } else if (error.message.includes("ALREADY_SCANNED")) {
                errorMessage = 'QR CODE INI SUDAH DIGUNAKAN SEBELUMNYA.';
            }

            setVerificationResult({ 
                status: status, 
                message: errorMessage, 
                code 
            });
            
            if (navigator.vibrate) navigator.vibrate(500);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleManualCompletion = async () => {
        // Fungsi ini dipanggil saat Donatur klik tombol "Selesai" di ActionBar
        if (isCompleting) return;
        
        setIsCompleting(true);
        try {
            await db.updateClaimStatus(order.id, 'completed');
            // TAMPILKAN SPLASH SCREEN SETELAH SUKSES UPDATE DB
            setShowSuccessSplash(true);
        } catch (error) {
            console.error("Failed to complete order:", error);
            alert("Gagal menyelesaikan pesanan. Silakan coba lagi.");
        } finally {
            setIsCompleting(false);
        }
    };

    const handleCloseSplash = () => {
        setShowSuccessSplash(false);
        if (onComplete) onComplete('completed'); // Navigasi kembali ke list setelah splash ditutup
    };

    const scanQRCode = () => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d', { willReadFrequently: true });

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code && code.data) {
                    handleVerifyCode(code.data);
                }
            }
        }
        requestRef.current = requestAnimationFrame(scanQRCode);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("Play failed:", e));
                    requestRef.current = requestAnimationFrame(scanQRCode);
                };
            }
        } catch (err) {
            console.error("Camera error:", err);
            setScannerMode('manual');
        }
    };
  
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
    };
  
    useEffect(() => {
        if (showVerifyModal && scannerMode === 'camera') {
            const timer = setTimeout(() => startCamera(), 200);
            return () => {
                clearTimeout(timer);
                stopCamera();
            };
        } else {
            stopCamera();
        }
    }, [showVerifyModal, scannerMode]);

    return (
        // Changed to Flexbox layout to fix ActionBar stacking/click issues caused by fixed position inside transform
        <div className="fixed inset-0 bg-[#FDFBF7] dark:bg-stone-900 z-[100] animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pb-4">
                <HeaderSection order={order} onBack={onBack} />
                <div className="px-6 space-y-6 -mt-4 relative z-10 pb-6">
                    <OrderInfoCard orderId={order.id} />
                    <ReceiverInfo receiver={order.receiver} onContact={() => {}} />
                    {order.deliveryMethod !== 'pickup' && order.courier && (
                        <CourierInfo courier={order.courier} onContact={() => {}} />
                    )}
                    <TimelineDetails 
                        timestamps={order.timestamps} 
                        deliveryMethod={order.deliveryMethod} 
                        targetAddress={order.receiver.address} // Pass dynamic address here
                    />
                    <WarningNote />
                </div>
            </div>

            <ActionBar 
                onCancel={onBack} 
                onVerify={() => setShowVerifyModal(true)} 
                isVerifying={isVerifying}
                isCompleting={isCompleting}
                isCompleted={order.status === 'completed' || isScanSuccess}
                onComplete={handleManualCompletion} 
            />

            {/* SPLASH SCREEN SUKSES */}
            {showSuccessSplash && (
                <SuccessVerificationSplash 
                    receiverName={order.receiver.name}
                    foodName={order.foodName}
                    points={verificationResult.pointsEarned}
                    onClose={handleCloseSplash}
                />
            )}

            {showVerifyModal && (
                <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in">
                    <button onClick={() => { setShowVerifyModal(false); stopCamera(); }} className="absolute top-6 right-6 p-2 bg-stone-800 rounded-full text-white z-50 hover:bg-stone-700">
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="w-full max-w-sm">
                        <div className="text-center mb-6">
                            <h3 className="text-white font-black text-2xl uppercase italic tracking-tight">Verifikasi Pesanan</h3>
                            <p className="text-stone-500 text-sm font-medium">Scan QR Code Penerima</p>
                        </div>

                        {scannerMode === 'camera' ? (
                            <div className="relative rounded-[2.5rem] overflow-hidden aspect-square bg-black border-2 border-stone-800 shadow-2xl mx-auto group">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <canvas ref={canvasRef} className="hidden" />
                                
                                <div className="absolute inset-0 z-20 pointer-events-none">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-[scan_2s_infinite_linear]"></div>
                                    <div className="absolute inset-0 border-[40px] border-black/40"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/20 rounded-3xl"></div>
                                </div>

                                {isVerifying && (
                                    <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                                    </div>
                                )}

                                {verificationResult.status !== 'idle' && (
                                    <div className={`absolute inset-0 z-40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 ${
                                        verificationResult.status === 'success' ? 'bg-green-600/90' : 
                                        verificationResult.status === 'already_taken' ? 'bg-amber-600/90' : 'bg-red-600/90'
                                    }`}>
                                        {verificationResult.status === 'success' ? <CheckCircle2 className="w-16 h-16 text-white mb-4 animate-bounce" /> : <AlertCircle className="w-16 h-16 text-white mb-4 animate-shake" />}
                                        <h3 className="text-white font-black text-xl uppercase italic leading-tight mb-2">{verificationResult.message}</h3>
                                        {verificationResult.status !== 'success' ? (
                                            <Button onClick={() => setVerificationResult({status:'idle', message:''})} variant="outline" className="mt-6 border-white text-white">Coba Lagi</Button>
                                        ) : (
                                            <Button onClick={() => { setShowVerifyModal(false); stopCamera(); }} variant="outline" className="mt-6 border-white text-white">Lanjutkan</Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-stone-900 rounded-[2.5rem] p-8 border border-stone-800 shadow-2xl aspect-square flex flex-col justify-center relative overflow-hidden">
                                {verificationResult.status !== 'idle' && (
                                    <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 ${
                                        verificationResult.status === 'success' ? 'bg-green-600/95' : 
                                        verificationResult.status === 'already_taken' ? 'bg-amber-600/95' : 'bg-red-600/95'
                                    }`}>
                                        {verificationResult.status === 'success' ? <CheckCircle2 className="w-16 h-16 text-white mb-4" /> : <AlertCircle className="w-16 h-16 text-white mb-4 animate-shake" />}
                                        <h3 className="text-white font-black text-xl uppercase italic leading-tight mb-2">{verificationResult.message}</h3>
                                        {verificationResult.status !== 'success' ? (
                                            <Button onClick={() => setVerificationResult({status:'idle', message:''})} variant="outline" className="mt-6 border-white text-white">Coba Lagi</Button>
                                        ) : (
                                            <Button onClick={() => { setShowVerifyModal(false); stopCamera(); }} variant="outline" className="mt-6 border-white text-white">Lanjutkan</Button>
                                        )}
                                    </div>
                                )}

                                <ScanLine className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                                <h4 className="text-white font-black text-lg mb-6 text-center uppercase tracking-widest italic">Input Kode Manual</h4>
                                <Input 
                                    label="KODE PENUKARAN"
                                    placeholder="CONTOH: FAR-1234" 
                                    value={manualCode} 
                                    onChange={e => setManualCode(e.target.value.toUpperCase())}
                                    className="bg-black border-stone-700 text-white text-center font-mono text-2xl h-16 mb-6"
                                />
                                <Button onClick={() => handleVerifyCode(manualCode)} disabled={!manualCode || isVerifying || verificationResult.status !== 'idle'} isLoading={isVerifying}>
                                    Verifikasi Kode
                                </Button>
                            </div>
                        )}

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button onClick={() => { setScannerMode('camera'); setVerificationResult({status:'idle', message:''}); }} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${scannerMode === 'camera' ? 'bg-orange-600 text-white border-orange-500' : 'bg-stone-900 text-stone-600 border-stone-800'}`}>
                                <Camera className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Kamera</span>
                            </button>
                            <button onClick={() => { setScannerMode('manual'); setVerificationResult({status:'idle', message:''}); }} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${scannerMode === 'manual' ? 'bg-orange-600 text-white border-orange-500' : 'bg-stone-900 text-stone-600 border-stone-800'}`}>
                                <Keyboard className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Keyboard</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
