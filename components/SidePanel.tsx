
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppMode, LiveModeType } from '../types';
import StaticChat from './StaticChat';
import LiveMode from './LiveMode';
import { MessageSquare, Radio, Settings2, Sparkles } from 'lucide-react';

interface SidePanelProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onGenerateImage: (url: string, prompt: string) => void;
  addPendingToCanvas: (prompt: string) => string;
  finalizeCanvasItem: (id: string, url: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ mode, setMode, addPendingToCanvas, finalizeCanvasItem }) => {
  return (
    <aside className="w-[420px] h-full flex flex-col bg-white/[0.02] border-l border-white/5 backdrop-blur-3xl z-30">
      <div className="p-4 border-b border-white/5">
        <div className="p-1.5 bg-black/40 rounded-2xl flex items-center gap-1">
          <button
            onClick={() => setMode(AppMode.STATIC)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-300 ${
              mode === AppMode.STATIC 
                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white shadow-inner shadow-white/5 border border-white/10' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Static Chat
          </button>
          <button
            onClick={() => setMode(AppMode.LIVE)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-300 ${
              mode === AppMode.LIVE 
                ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-white shadow-inner shadow-white/5 border border-white/10' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Radio className="w-4 h-4" />
            Live Stream
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {mode === AppMode.STATIC ? (
            <motion.div
              key="static"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <StaticChat addPendingToCanvas={addPendingToCanvas} finalizeCanvasItem={finalizeCanvasItem} />
            </motion.div>
          ) : (
            <motion.div
              key="live"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <LiveMode addPendingToCanvas={addPendingToCanvas} finalizeCanvasItem={finalizeCanvasItem} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-medium uppercase tracking-widest">
        <div className="flex items-center gap-4">
           <button className="hover:text-white flex items-center gap-1.5 transition-colors">
            <Sparkles className="w-3 h-3 text-yellow-500/80" />
            Capabilities
          </button>
          <button className="hover:text-white flex items-center gap-1.5 transition-colors">
            <Settings2 className="w-3 h-3" />
            Config
          </button>
        </div>
        <div className="opacity-50">v1.2.0-beta</div>
      </div>
    </aside>
  );
};

export default SidePanel;
