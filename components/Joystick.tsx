import React, { useRef, useState, useEffect, useCallback } from 'react';
import { JoystickType, Vector2 } from '../types';

interface JoystickProps {
  type: JoystickType;
  onMove: (vector: Vector2, active: boolean) => void;
}

const Joystick: React.FC<JoystickProps> = ({ type, onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState<Vector2 | null>(null);

  // Configuration
  const maxRadius = 50;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    // For movement (left), the joystick centers where you touch if it's a floating feel, 
    // but we will stick to a fixed area for simplicity or fixed center.
    // Let's do fixed center for now within the container.
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setOrigin({ x: centerX, y: centerY });
    setActive(true);
    
    handleMove(clientX, clientY, centerX, centerY);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number, centerX: number, centerY: number) => {
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let finalX = dx;
    let finalY = dy;

    // Clamp
    if (distance > maxRadius) {
      const ratio = maxRadius / distance;
      finalX = dx * ratio;
      finalY = dy * ratio;
    }

    setPosition({ x: finalX, y: finalY });

    // Normalize output -1 to 1
    onMove({
      x: finalX / maxRadius,
      y: finalY / maxRadius
    }, true);

  }, [onMove]);

  const handleEnd = useCallback(() => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 }, false);
    setOrigin(null);
  }, [onMove]);

  // Touch handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scroll
      handleStart(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (origin) {
        handleMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY, origin.x, origin.y);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [origin, handleStart, handleMove, handleEnd]);

  // Mouse handlers for testing on desktop (optional, mainly for dev)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (active && origin) {
      handleMove(e.clientX, e.clientY, origin.x, origin.y);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute bottom-8 ${type === JoystickType.MOVEMENT ? 'left-8' : 'right-8'} w-40 h-40 rounded-full bg-black/20 backdrop-blur-sm border-2 border-white/10 flex items-center justify-center touch-none select-none z-50`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {/* Inner Stick */}
      <div 
        ref={knobRef}
        className={`w-16 h-16 rounded-full shadow-lg transition-transform duration-75 ${
          type === JoystickType.MOVEMENT ? 'bg-blue-500' : 'bg-red-500'
        }`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          opacity: active ? 0.9 : 0.5
        }}
      >
        {/* Decoration */}
        <div className="w-full h-full rounded-full border-t-4 border-white/30"></div>
      </div>
    </div>
  );
};

export default Joystick;