
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CanvasItem } from '../types';
import { X, Download, Plus, Loader2 } from 'lucide-react';

interface DraggableCardProps {
  item: CanvasItem;
  onRemove: () => void;
  onUpdate: (id: string, x: number, y: number) => void;
  constraintsRef: React.RefObject<HTMLDivElement>;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ item, onRemove, onUpdate, constraintsRef }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.url) return;
    
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `visionary-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragMomentum={false}
      initial={{ x: item.x, y: item.y, opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onDragEnd={(_, info) => {
        onUpdate(item.id, info.point.x, info.point.y);
      }}
      className="absolute group z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ touchAction: 'none' }}
    >
      <div 
        className="relative p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:bg-white/10"
        style={{ width: item.width, height: 'auto' }}
      >
        <div className="relative aspect-square rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
           {item.isPending ? (
             <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="relative flex items-center justify-center"
                >
                  <Plus className="w-12 h-12 text-purple-500/40" />
                  <Loader2 className="absolute w-16 h-16 text-purple-500 animate-spin" strokeWidth={1} />
                </motion.div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">
                    Crafting Vision...
                  </p>
                  <p className="text-[8px] text-gray-500 font-medium">Gemini 2.5 Flash Image Model</p>
                </div>
             </div>
           ) : (
             <>
               <img 
                src={item.url} 
                alt={item.prompt} 
                className="w-full h-full object-cover pointer-events-none select-none"
                loading="lazy"
              />
              
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center gap-3"
                  >
                    <button 
                      onClick={handleDownload}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors group/btn"
                      title="Download Image"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                    <button 
                       onClick={(e) => { e.stopPropagation(); onRemove(); }}
                       className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-full transition-colors"
                       title="Remove Card"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
             </>
           )}
        </div>
        
        <div className="mt-3 px-1">
          <p className="text-[11px] text-gray-400 line-clamp-2 italic leading-relaxed">
            &quot;{item.prompt}&quot;
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">
              {item.isPending ? 'GENERATING...' : 'GENERATED AI'}
            </span>
            <span className="text-[9px] text-gray-500">
              {new Date(item.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DraggableCard;
