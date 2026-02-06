# Data Flow Analysis

The application manages two distinct data pipelines: **The Structured Pipeline** (Static) and **The Streaming Pipeline** (Live).

## 1. Static Mode Flow (JSON Parsing)
1. **Input:** User types "Draw a neon cat."
2. **Orchestration:** `gemini-3-flash` receives text + System Instruction.
3. **Reasoning:** Model decides to generate an image and outputs: `Here is your cat! { "action": "generate_image", "prompt": "neon cat" }`.
4. **Extraction:** Regex/JSON parser identifies the payload.
5. **Execution:** `generateImage()` service is called.
6. **Reconciliation:** Placeholder is added to Canvas -> Final URL replaces placeholder.

## 2. Live Mode Flow (Function Calling)
1. **Input:** User speaks "Show me a futuristic city."
2. **Streaming:** Raw PCM audio chunks are sent to the Live Endpoint.
3. **Inference:** The model processes audio in real-time.
4. **Tool Trigger:** Model emits a `toolCall` for the function `generate_image`.
5. **UI Callback:** `onImageIntent` is triggered in the React component.
6. **Rendering:** The Image engine manifests the city on the Canvas while the AI continues to speak ("I'm drawing that futuristic city for you...").
