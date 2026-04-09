
import React, { useState, useEffect } from 'react';

interface CounterUpProps {
    end: number;
    duration?: number;
    decimals?: number;
}

export const CounterUp: React.FC<CounterUpProps> = ({ end, duration = 2000, decimals = 0 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const totalFrames = Math.round(duration / 16); // 60fps approx
        const increment = (end - start) / totalFrames;
        let currentFrame = 0;

        const timer = setInterval(() => {
            currentFrame++;
            setCount(prev => {
                const next = prev + increment;
                if (currentFrame >= totalFrames) {
                    clearInterval(timer);
                    return end;
                }
                return next;
            });
        }, 16);

        return () => clearInterval(timer);
    }, [end, duration]);

    return <span>{count.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
};
