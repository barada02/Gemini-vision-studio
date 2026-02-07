# System Architecture

Visionary Studio follows a **Hybrid Orchestration Architecture**. The frontend acts as the primary "Director," managing state and routing instructions to specialized AI models based on the interaction mode.

## 1. System Topology

```mermaid
graph TD
    subgraph "Frontend (React 19)"
        UI[App UI Root]
        Canvas[Infinite Canvas Manager]
        Chat[Static Chat Modality]
        Live[Live Streaming Modality]
        Storage[Canvas State - React]
    end

    subgraph "Gemini AI Services"
        Orch[Gemini 3 Flash - Logic Orchestrator]
        Vision[Gemini 2.5 Flash Image - Vision Engine]
        Native[Gemini 2.5 Native Audio - Real-time Voice/Video]
    end

    UI --> Chat
    UI --> Live
    UI --> Canvas
    
    Chat --> Orch
    Live --> Native
    Orch -- "JSON Trigger" --> Vision
    Native -- "Tool Call" --> Vision
    Vision -- "Base64 Image" --> Canvas
    Storage -- "Sync" --> UI
```

## 2. Component Hierarchy
- **App (Root):** Central State Manager. Holds the `canvasItems` and `appMode`.
- **Canvas:** The "Entity Manager." Renders and handles physics/draggability for AI outputs.
- **SidePanel:** The "Command Center." Toggles between input modalities.
  - **StaticChat:** Request/Response logic for deep reasoning.
  - **LiveMode:** WebSocket-based streaming interface.

## 3. Communication Layer
- **Static Mode:** Uses standard HTTPS POST requests (Unary/Stream) via the SDK.
- **Live Mode:** Establishes a persistent WebSocket connection for bidirectional raw PCM audio and JPEG frame streaming.
