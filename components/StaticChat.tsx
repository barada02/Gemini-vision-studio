
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Image as ImageIcon, FileText, Loader2, User, Bot, Trash2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatWithGemini, generateImage } from '../services/gemini';

interface StaticChatProps {
  addPendingToCanvas: (prompt: string) => string;
  finalizeCanvasItem: (id: string, url: string) => void;
}

const StaticChat: React.FC<StaticChatProps> = ({ addPendingToCanvas, finalizeCanvasItem }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      role: 'model', 
      text: "Welcome to Gemini Visionary Studio. I can assist with complex queries, analyze your files, or generate creative visuals. How can I help today?" 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput && files.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmedInput,
      attachments: files.map(f => f.name)
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setFiles([]);
    setIsTyping(true);

    try {
      // 1. Send message to Gemini 3
      const rawResponse = await chatWithGemini(userMessage.text);
      if (!rawResponse) throw new Error("No response from AI");

      let cleanText = rawResponse;
      let imagePromptToExecute: string | null = null;

      // 2. Parse response for Image Generation Actions (JSON patterns)
      // Look for { "action": "...", "prompt": "..." } or similar
      const jsonMatch = rawResponse.match(/\{[\s\S]*?\}/g);
      
      if (jsonMatch) {
        for (const match of jsonMatch) {
          try {
            const data = JSON.parse(match);
            
            // Check for various possible keys (standardizing model output)
            if (data.action === 'generate_image' || data.action === 'dalle.text2im') {
              // Extract prompt even if nested in action_input
              if (typeof data.action_input === 'string') {
                try {
                   const inputData = JSON.parse(data.action_input);
                   imagePromptToExecute = inputData.prompt;
                } catch {
                   imagePromptToExecute = data.action_input;
                }
              } else {
                imagePromptToExecute = data.prompt || data.action_input?.prompt;
              }
              
              // Remove the JSON block from the chat text for a cleaner UI
              cleanText = cleanText.replace(match, '').trim();
            }
          } catch (e) {
            // Not a valid JSON block, ignore
          }
        }
      }

      // Fallback: Keyword detection if model didn't use JSON but user clearly asked
      const drawKeywords = ['draw', 'generate image', 'create image', 'visualize', 'make a picture'];
      const isUserAskingDirectly = drawKeywords.some(kw => userMessage.text.toLowerCase().includes(kw));
      
      if (!imagePromptToExecute && isUserAskingDirectly) {
        imagePromptToExecute = userMessage.text;
        drawKeywords.forEach(kw => {
          imagePromptToExecute = imagePromptToExecute?.replace(new RegExp(`^.*?${kw}`, 'i'), '').trim() || null;
        });
      }

      // 3. Update Chat with AI's conversational response
      const botResponseId = Date.now().toString();
      setMessages(prev => [...prev, { 
        id: botResponseId, 
        role: 'model', 
        text: cleanText || (imagePromptToExecute ? "Starting image generation process..." : "I'm not sure how to respond to that."),
        isGenerating: !!imagePromptToExecute
      }]);

      // 4. If image generation was detected, execute it
      if (imagePromptToExecute) {
        console.log(`[Visionary Studio] Image Intent Detected: "${imagePromptToExecute}"`);
        
        // Immediate Placeholder
        const canvasItemId = addPendingToCanvas(imagePromptToExecute);
        
        // Call Vision Model
        const imageUrl = await generateImage(imagePromptToExecute);
        
        if (imageUrl) {
          finalizeCanvasItem(canvasItemId, imageUrl);
          setMessages(prev => prev.map(m => m.id === botResponseId ? { 
            ...m, 
            isGenerating: false,
            text: m.text + "\n\n✨ Generation complete! See the canvas."
          } : m));
        } else {
          setMessages(prev => prev.map(m => m.id === botResponseId ? { 
            ...m, 
            isGenerating: false,
            text: m.text + "\n\n⚠️ Image generation failed. Please try a different description."
          } : m));
        }
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "System error: Failed to process request. Please check console for details." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/10">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${
                msg.role === 'user' ? 'bg-purple-600/30' : 'bg-blue-600/30'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none backdrop-blur-sm shadow-xl shadow-black/20'
                }`}>
                  {msg.text}
                  {msg.isGenerating && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 text-xs text-blue-400 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Engaging Visionary Engine...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && !messages[messages.length-1]?.isGenerating && (
           <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 bg-blue-600/30">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex gap-1 items-center px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-xl">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 min-h-[52px] rounded-2xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition-all flex items-end p-2 px-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={onFileChange} 
            />
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe a vision or ask a question..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32 scrollbar-hide text-white placeholder:text-gray-600"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={(!inputValue.trim() && files.length === 0) || isTyping}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaticChat;
