# UI Wireframes & Layout

The Studio uses a specialized glassmorphism layout designed for creative immersion.

## Layout Schema

```mermaid
graph TD
    subgraph "Main Studio (Viewport)"
        Canvas[Infinite Canvas Area - Dot Grid]
        Header[Floating Header: Logo & Status]
        Overlay[Live Video Overlay - Floating]
    end

    subgraph "Side Panel (Fixed 420px)"
        Tabs[Static / Live Toggler]
        Content[Chat Flow or Stream Controls]
        Footer[Version & Capabilities]
    end

    subgraph "Canvas Item (Card)"
        Image[AI Generated Image]
        Meta[Prompt & Timestamp]
        Actions[Download / Delete Buttons]
    end

    Canvas -- "Contains" --> CanvasItem
```

## Design Principles
1. **Depth:** Uses `backdrop-blur-3xl` and `z-index` layering to separate the canvas from the command panel.
2. **Context:** Pending items show a specialized "Crafting" state with spinning loaders to reduce perceived latency.
3. **Responsive:** Side panel is optimized for desktop interaction, while the canvas supports multi-touch dragging.
