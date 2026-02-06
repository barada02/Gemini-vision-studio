
export interface CanvasItem {
  id: string;
  type: 'image' | 'analysis';
  url: string;
  prompt: string;
  timestamp: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isPending?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: string[];
  isGenerating?: boolean;
}

export enum AppMode {
  STATIC = 'STATIC',
  LIVE = 'LIVE'
}

export enum LiveModeType {
  VIDEO_VOICE = 'VIDEO_VOICE',
  VOICE_ONLY = 'VOICE_ONLY'
}
