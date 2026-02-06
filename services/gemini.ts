
import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from '@google/genai';
import { LiveModeType } from '../types';

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const chatWithGemini = async (prompt: string): Promise<string | undefined> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are the AI brain behind Visionary Studio. 
        1. For general chat, be concise and creative.
        2. IF you want to generate an image, you MUST include a JSON block at the end of your response like this: 
           { "action": "generate_image", "prompt": "detailed prompt here" }
        3. Do not just describe the image, trigger the action.`,
      }
    });
    return response.text;
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    return "Error communicating with Gemini 3.";
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    console.error("Image Generation Error:", err);
    return null;
  }
};

interface LiveSessionParams {
  type: LiveModeType;
  stream: MediaStream;
  canvas: HTMLCanvasElement | null;
  video: HTMLVideoElement | null;
  onImageIntent?: (prompt: string) => void;
}

const generateImageTool: FunctionDeclaration = {
  name: 'generate_image',
  parameters: {
    type: Type.OBJECT,
    description: 'Generates a new image on the users studio canvas based on a description.',
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'A detailed, creative description of the image to generate.',
      },
    },
    required: ['prompt'],
  },
};

export const startLiveSession = async ({ type, stream, canvas, video, onImageIntent }: LiveSessionParams) => {
  const ai = getAIClient();
  
  let nextStartTime = 0;
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  const sources = new Set<AudioBufferSourceNode>();

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => {
        console.log('[Visionary Live] Connection established');
        
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          const pcmBlob = createPcmBlob(inputData);
          sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);

        if (type === LiveModeType.VIDEO_VOICE && canvas && video) {
          const ctx = canvas.getContext('2d');
          const interval = setInterval(() => {
            if (!stream.active) { clearInterval(interval); return; }
            if (ctx && video && video.readyState >= 2) {
              canvas.width = 320;
              canvas.height = 240;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const base64Data = await blobToBase64(blob);
                  sessionPromise.then(session => {
                    session.sendRealtimeInput({
                      media: { data: base64Data, mimeType: 'image/jpeg' }
                    });
                  });
                }
              }, 'image/jpeg', 0.6);
            }
          }, 1000 / 2);
        }
      },
      onmessage: async (message: LiveServerMessage) => {
        // 1. Handle Function Calls (Tool Usage)
        if (message.toolCall) {
          for (const fc of message.toolCall.functionCalls) {
            if (fc.name === 'generate_image') {
              const prompt = (fc.args as any).prompt;
              console.log(`[Visionary Live] AI Tool Call: generate_image("${prompt}")`);
              if (onImageIntent) onImageIntent(prompt);
              
              // Confirm execution back to model
              sessionPromise.then(session => {
                session.sendToolResponse({
                  functionResponses: {
                    id: fc.id,
                    name: fc.name,
                    response: { result: "Image generation started on the canvas." },
                  }
                });
              });
            }
          }
        }

        // 2. Handle Audio Output
        const audioData = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (audioData) {
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
          const audioBuffer = await decodeAudioData(
            decodeBase64(audioData),
            outputAudioContext,
            24000,
            1
          );
          const source = outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputNode);
          source.start(nextStartTime);
          nextStartTime += audioBuffer.duration;
          sources.add(source);
          source.onended = () => sources.delete(source);
        }

        if (message.serverContent?.interrupted) {
          sources.forEach(s => { try { s.stop(); } catch(e) {} });
          sources.clear();
          nextStartTime = 0;
        }
      },
      onerror: (e) => console.error("[Visionary Live] Socket Error:", e),
      onclose: () => console.log("[Visionary Live] Session closed")
    },
    config: {
      responseModalities: [Modality.AUDIO],
      tools: [{ functionDeclarations: [generateImageTool] }],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
      },
      systemInstruction: `You are the creative spirit of Visionary Studio.
      You interact with users via real-time audio and video.
      - You have a tool called 'generate_image'.
      - Use 'generate_image' whenever the user asks you to draw something, visualize a concept, or if you decide to show them something visual.
      - Always tell the user "I am drawing that for you now" when you use the tool.`
    }
  });

  return sessionPromise;
};

function createPcmBlob(data: Float32Array) {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
  }
  return {
    data: encodeBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000'
  };
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}
