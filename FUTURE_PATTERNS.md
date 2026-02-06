# Future AI Design Patterns

To evolve Visionary Studio into a world-class platform, the following patterns should be implemented:

## 1. Agentic Tool Use (Multi-Tooling)
Expand the `tools` array in Live Mode to include:
- `search_web`: Using Google Search grounding for real-time data.
- `edit_canvas`: Allowing the AI to move, resize, or delete existing cards.
- `analyze_file`: Connecting the Static file-upload logic into the Live session.

## 2. State Memory (Vector Store)
Currently, sessions are stateless.
- **Pattern:** Use a `LongTermMemory` agent that summarizes canvas contents and user preferences into a Vector Database.
- **Benefit:** "Gemini, remember the style of the cat you drew yesterday."

## 3. Real-time Multi-User Sync
- **Pattern:** Integration with CRDTs (Conflict-free Replicated Data Types) like Yjs.
- **Benefit:** Multiple users in different Live sessions collaborating on the same Visionary Canvas.

## 4. Prompt "Refining" Loop
- **Pattern:** Before sending a prompt to the Image Model, send it to a "Prompt Engineer" agent to add technical descriptors (e.g., "8k, Octane Render, cinematic lighting").
