
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CanvasItem } from '../types';
import DraggableCard from './DraggableCard';
import { Ghost } from 'lucide-react';

interface CanvasProps {
  items: CanvasItem[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const Canvas: React.FC<CanvasProps> = ({ items, onRemove, onUpdate, containerRef }) => {
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full p-8 overflow-hidden bg-grid-white/[0.02]"
      style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}
    >
      <AnimatePresence>
        {items.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 select-none pointer-events-none"
          >
            <Ghost className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm font-medium">Canvas is empty</p>
            <p className="text-xs opacity-50">Tell Gemini to generate something to see it here.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0">
        {items.map((item) => (
          <DraggableCard 
            key={item.id} 
            item={item} 
            onRemove={() => onRemove(item.id)}
            onUpdate={onUpdate}
            constraintsRef={containerRef}
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;
