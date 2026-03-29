
import React, { useState } from 'react';
import { X, ArrowLeft, ChevronRight } from 'lucide-react';

interface MediaLightboxProps {
    mediaUrls: string[];
    initialIndex: number;
    onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ mediaUrls, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
    const [isClosing, setIsClosing] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    const isVideo = (url: string) => url.toLowerCase().match(/\.(mp4|webm|ogg)$/) || url.includes('video');

    const handleClose = (e?: React.MouseEvent | any) => {
        e?.stopPropagation();
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handlePrev = (e?: any) => {
        e?.stopPropagation();
        if (currentIndex > 0) {
            setSlideDirection('left');
            setCurrentIndex(currentIndex - 1);
            setDragOffset(0);
        }
    };

    const handleNext = (e?: any) => {
        e?.stopPropagation();
        if (currentIndex < mediaUrls.length - 1) {
            setSlideDirection('right');
            setCurrentIndex(currentIndex + 1);
            setDragOffset(0);
        }
    };

    // Gesture Handlers
    const handleStart = (clientX: number) => {
        setIsDragging(true);
        setStartX(clientX);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging) return;
        const offset = clientX - startX;
        setDragOffset(offset);
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        // Threshold for navigation
        if (dragOffset < -80 && currentIndex < mediaUrls.length - 1) {
            handleNext();
        } else if (dragOffset > 80 && currentIndex > 0) {
            handlePrev();
        } else {
            setDragOffset(0);
        }
    };

    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
    const stopPropagation = (e: any) => e.stopPropagation();

    return (
        <div 
            className={`fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden touch-none ${
                isClosing ? 'animate-out fade-out duration-300' : 'animate-in fade-in'
            }`} 
            onClick={handleClose}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={handleEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
        >
            <button 
                onClick={handleClose}
                onMouseDown={stopPropagation}
                onTouchStart={stopPropagation}
                className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all z-[260] outline-none"
            >
                <X className="w-6 h-6" />
            </button>
            
            {/* Navigation Arrows */}
            {currentIndex > 0 && (
                <button 
                    onClick={handlePrev} 
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="absolute left-2 md:left-10 p-3 md:p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all z-[260] flex items-center justify-center shadow-lg"
                >
                    <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            )}
            {currentIndex < mediaUrls.length - 1 && (
                <button 
                    onClick={handleNext} 
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="absolute right-2 md:right-10 p-3 md:p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all z-[260] flex items-center justify-center shadow-lg"
                >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            )}

            <div className="max-w-5xl w-full h-full flex flex-col items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                <div 
                    key={`preview-${currentIndex}`}
                    style={{ 
                        transform: Math.abs(dragOffset) > 5 ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)` : 'none',
                        transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    className={`relative w-full h-full flex items-center justify-center select-none ${
                        isClosing ? 'animate-slide-out-down' : 
                        (!isDragging ? (slideDirection === 'right' ? 'animate-card-swap-right' : 'animate-card-swap-left') : '')
                    }`}
                >
                    {isVideo(mediaUrls[currentIndex]) ? (
                        <div className="relative w-full h-full flex items-center justify-center group/video">
                            <video 
                                src={mediaUrls[currentIndex]} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                onContextMenu={e => e.preventDefault()}
                                className="max-w-full max-h-full rounded-3xl shadow-2xl pointer-events-auto" 
                            />
                            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-white/80 uppercase tracking-widest opacity-0 group-hover/video:opacity-100 transition-opacity">
                                Private Video
                            </div>
                        </div>
                    ) : (
                        <img 
                            src={mediaUrls[currentIndex]} 
                            className="max-w-full max-h-full rounded-3xl shadow-2xl object-contain pointer-events-auto" 
                            alt="Preview" 
                            draggable={false}
                        />
                    )}
                </div>
            </div>

            {/* Pagination Bullet Indicators */}
            {mediaUrls.length > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-[260]">
                    {mediaUrls.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-orange-500 shadow-lg shadow-orange-500/40' : 'w-1.5 bg-white/30'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
