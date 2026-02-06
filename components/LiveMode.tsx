
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, MicOff, Video, VideoOff, Power, Square, Sparkles, Loader2 } from 'lucide-react';
import { LiveModeType } from '../types';
import { startLiveSession, generateImage } from '../services/gemini';

interface LiveModeProps {
  addPendingToCanvas: (prompt: string) => string;
  finalizeCanvasItem: (id: string, url: string) => void;
}

const LiveMode: React.FC<LiveModeProps> = ({ addPendingToCanvas, finalizeCanvasItem }) => {
  const [isActive, setIsActive] = useState(false);
  const [liveType, setLiveType] = useState<LiveModeType>(LiveModeType.VIDEO_VOICE);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream && isVideoOn) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [stream, isActive, isVideoOn]);

  const handleImageIntent = useCallback(async (prompt: string) => {
    console.log(`[Visionary Live UI] UI received image intent: "${prompt}"`);
    setLastIntent(prompt);
    setIsProcessingImage(true);
    
    try {
      // 1. Show placeholder on canvas
      const canvasItemId = addPendingToCanvas(prompt);
      
      // 2. Generate Image
      const imageUrl = await generateImage(prompt);
      
      if (imageUrl) {
        finalizeCanvasItem(canvasItemId, imageUrl);
      }
    } catch (err) {
      console.error("[Visionary Live UI] Image generation failed:", err);
    } finally {
      setIsProcessingImage(false);
      setTimeout(() => setLastIntent(null), 5000);
    }
  }, [addPendingToCanvas, finalizeCanvasItem]);

  const startLive = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: liveType === LiveModeType.VIDEO_VOICE ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        } : false,
        audio: true 
      });
      
      setStream(mediaStream);
      setIsActive(true);
      
      console.log("[Visionary Live] Starting session with type:", liveType);
      const session = await startLiveSession({
        type: liveType,
        stream: mediaStream,
        canvas: canvasRef.current,
        video: videoRef.current,
        onImageIntent: handleImageIntent
      });
      sessionRef.current = session;

    } catch (err) {
      console.error("Failed to start live mode:", err);
      alert("Permission denied or session failed. Please ensure camera/mic access.");
    }
  };

  const stopLive = () => {
    console.log("[Visionary Live] Stopping session...");
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (sessionRef.current) {
       sessionRef.current.then((s: any) => s.close()).catch(() => {});
    }
    setStream(null);
    setIsActive(false);
    setIsMicOn(true);
    setIsVideoOn(true);
    setLastIntent(null);
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  useEffect(() => {
    return () => stopLive();
  }, []);

  return (
    <div className="flex flex-col h-full bg-black/20 p-6">
      <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl mb-6">
        <button 
          onClick={() => setLiveType(LiveModeType.VIDEO_VOICE)}
          disabled={isActive}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300 ${
            liveType === LiveModeType.VIDEO_VOICE 
              ? 'bg-white/10 text-white border border-white/10' 
              : 'text-gray-500 hover:text-gray-400 grayscale disabled:opacity-40'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Video + Voice</span>
        </button>
        <button 
          onClick={() => setLiveType(LiveModeType.VOICE_ONLY)}
          disabled={isActive}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300 ${
            liveType === LiveModeType.VOICE_ONLY 
              ? 'bg-white/10 text-white border border-white/10' 
              : 'text-gray-500 hover:text-gray-400 grayscale disabled:opacity-40'
          }`}
        >
          <Mic className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Voice Only</span>
        </button>
      </div>

      <div className="relative flex-1 rounded-3xl overflow-hidden bg-black border border-white/10 group shadow-2xl">
        {isActive ? (
          <>
            {liveType === LiveModeType.VIDEO_VOICE ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transition-opacity duration-700 ${isVideoOn ? 'opacity-100' : 'opacity-20 blur-xl'}`}
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                 <div className="relative">
                   <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse"></div>
                   <Mic className="w-24 h-24 text-blue-400/50 relative z-10" />
                 </div>
              </div>
            )}
            
            <AnimatePresence>
              {lastIntent && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-16 left-4 right-4 z-30 p-4 bg-purple-600/90 backdrop-blur rounded-2xl flex items-center gap-3 border border-white/20 shadow-2xl"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    {isProcessingImage ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Canvas Syncing</p>
                    <p className="text-sm font-medium text-white line-clamp-1 italic">"{lastIntent}"</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 flex items-end justify-center gap-1 h-12 z-20">
              {[...Array(24)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: isMicOn ? [4, Math.random() * 40 + 4, 4] : 4 }}
                  transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
                  className="w-1.5 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full opacity-60"
                />
              ))}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center bg-zinc-950">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Power className="w-10 h-10 text-gray-600" />
            </div>
            <button 
              onClick={startLive}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Start Stream
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {isActive && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-6 flex items-center justify-center gap-4"
        >
          {liveType === LiveModeType.VIDEO_VOICE && (
            <button onClick={toggleVideo} className={`p-4 rounded-2xl transition-colors ${isVideoOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          )}
          <button onClick={toggleMic} className={`p-4 rounded-2xl transition-colors ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          <button onClick={stopLive} className="p-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-600/20 hover:scale-105">
            <Square className="w-6 h-6" />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default LiveMode;
