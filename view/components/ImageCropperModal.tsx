
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './Button';
import { X, ZoomIn, Scissors, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';

interface ImageCropperModalProps {
    image: string;
    onCropComplete: (croppedImageBase64: string) => void;
    onClose: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ image, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isResetting, setIsResetting] = useState(false);

    const onCropCompleteInternal = useCallback((_unUsedCroppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any, flip = { horizontal: false, vertical: false }): Promise<string> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return '';
        }

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.translate(image.width / 2, image.height / 2);
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
        ctx.translate(-image.width / 2, -image.height / 2);

        ctx.drawImage(image, 0, 0);

        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');

        if (!croppedCtx) return '';

        croppedCanvas.width = pixelCrop.width;
        croppedCanvas.height = pixelCrop.height;

        croppedCtx.drawImage(
            canvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return croppedCanvas.toDataURL('image/jpeg', 0.9);
    };

    const handleDone = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels, flip);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-stone-900 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                            <Scissors className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">Atur Foto Profil</h3>
                            <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Geser dan zoom foto</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 rounded-2xl transition-all active:scale-90"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Cropper Container */}
                <div className="relative h-[400px] w-full bg-stone-100 dark:bg-stone-950">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={setZoom}
                        cropShape="round"
                        showGrid={false}
                        style={{
                            mediaStyle: {
                                scale: `${flip.horizontal ? -1 : 1} ${flip.vertical ? -1 : 1}`,
                                transition: isResetting 
                                    ? 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), scale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    : 'none',
                                objectFit: 'contain'
                            }
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="p-8 space-y-6">
                    <div className="flex flex-col gap-6">
                        {/* Controls */}
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex-1 flex items-center gap-6">
                                <ZoomIn className="w-5 h-5 text-stone-400 shrink-0" />
                                <div className="flex-1 px-1">
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full appearance-none cursor-pointer accent-orange-500"
                                    />
                                </div>
                                <span className="text-xs font-black text-stone-400 w-8 text-right font-mono">
                                    {Math.round(zoom * 100)}%
                                </span>
                            </div>

                            {/* Flip Controls */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFlip(f => ({ ...f, horizontal: !f.horizontal }))}
                                    className={`p-3 rounded-2xl transition-all active:scale-90 border-2 ${flip.horizontal ? 'bg-orange-500 border-orange-500 text-white' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'}`}
                                    title="Mirror Horizontal"
                                >
                                    <FlipHorizontal className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setFlip(f => ({ ...f, vertical: !f.vertical }))}
                                    className={`p-3 rounded-2xl transition-all active:scale-90 border-2 ${flip.vertical ? 'bg-orange-500 border-orange-500 text-white' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'}`}
                                    title="Mirror Vertical"
                                >
                                    <FlipVertical className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsResetting(true);
                                        setZoom(1);
                                        setFlip({ horizontal: false, vertical: false });
                                        setCrop({ x: 0, y: 0 });
                                        setTimeout(() => setIsResetting(false), 400);
                                    }}
                                    className="p-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 rounded-2xl transition-all active:scale-90 border-2 border-transparent"
                                    title="Reset"
                                >
                                    <RotateCw className="w-5 h-5 scale-x-[-1]" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button 
                            onClick={onClose}
                            className="h-14 border-2 border-stone-200 dark:border-stone-700 text-stone-500 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95"
                        >
                            Batal
                        </button>
                        <Button onClick={handleDone} className="shadow-orange-500/20 shadow-xl active:scale-95">
                            Terapkan Foto
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
