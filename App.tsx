
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppMode, CanvasItem } from './types';
import SidePanel from './components/SidePanel';
import Canvas from './components/Canvas';
import { Layout, Palette, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.STATIC);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addPendingToCanvas = useCallback((prompt: string): string => {
    const id = Math.random().toString(36).substring(7);
    const newItem: CanvasItem = {
      id,
      type: 'image',
      url: '',
      prompt,
      timestamp: Date.now(),
      x: Math.random() * 200 + 100,
      y: Math.random() * 200 + 100,
      width: 320,
      height: 320,
      isPending: true,
    };
    setCanvasItems(prev => [...prev, newItem]);
    console.log(`[Visionary Studio] Added pending item to canvas: ${id}`);
    return id;
  }, []);

  const finalizeCanvasItem = useCallback((id: string, url: string) => {
    setCanvasItems(prev => prev.map(item => 
      item.id === id ? { ...item, url, isPending: false } : item
    ));
    console.log(`[Visionary Studio] Finalized item on canvas: ${id}`);
  }, []);

  const removeItem = useCallback((id: string) => {
    setCanvasItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItemPosition = useCallback((id: string, x: number, y: number) => {
    setCanvasItems(prev => prev.map(item => 
      item.id === id ? { ...item, x, y } : item
    ));
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#030712] text-white overflow-hidden font-sans selection:bg-purple-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full"></div>
      </div>

      <main className="relative flex-1 h-full overflow-hidden">
        <header className="absolute top-0 left-0 right-0 z-20 p-6 pointer-events-none flex justify-between items-center">
          <div className="flex items-center gap-3 pointer-events-auto group">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-purple-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Visionary Studio
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Powered by Gemini 3</p>
            </div>
          </div>

          <div className="flex gap-4 pointer-events-auto">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-gray-400">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               AI System Ready
             </div>
          </div>
        </header>

        <Canvas 
          items={canvasItems} 
          onRemove={removeItem} 
          onUpdate={updateItemPosition}
          containerRef={canvasRef}
        />
      </main>

      <SidePanel 
        mode={mode} 
        setMode={setMode} 
        onGenerateImage={(url, prompt) => {}} // Legacy
        addPendingToCanvas={addPendingToCanvas}
        finalizeCanvasItem={finalizeCanvasItem}
      />
    </div>
  );
};

export default App;
