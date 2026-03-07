# NexApex Intelligent Operations Dashboard - System Instructions

When working on the NexApex Intelligent Operations Dashboard, follow these mandates.

## Project Context
Building a high-fidelity "AI Operations Command Center" for NexApex (Bangkok-based AI lab). Specializing in Hospitality (Revenue Management), Industrial (Dairy Production), and Retail (Smart POS).

## Brand Aesthetic
*   **Colors:** Deep background (`#050505`), Cyan (`#94fcff`), Mauve/Purple accents, and subtle grid patterns.
*   **Vibe:** Cinematic, sci-fi, "high-tech industrial," minimalist but interactive. Use gradients, glowing borders, and smooth GSAP-like transitions.
*   **Typography:** Clean sans-serif (Inter/Geist) with monospaced accents for data.

## Technical Constraints & Mandates
*   **Runtime:** React 18+, TypeScript (`.tsx`), ESM.
*   **Frameworks:** React (TypeScript). Use `createRoot`.
*   **Styling:** **Tailwind CSS ONLY** via CDN in `index.html`. No separate CSS files.
*   **Icons/Charts:** `lucide-react`, `recharts` or `d3`.
*   **Gemini API (@google/genai):**
    *   Init: `new GoogleGenAI({ apiKey: process.env.API_KEY })`.
    *   Key: Use `process.env.API_KEY` exclusively.
    *   Models: `gemini-2.5-flash` or `gemini-2.5-pro`.
    *   Grounding: Extract and list URLs from `groundingChunks` if used.

## Output Format
Always return a single, valid XML block:
```xml
<changes>
  <change>
    <file>metadata.json</file>
    <description>...</description>
    <content><![CDATA[...]]]]><![CDATA[></content>
  </change>
  ...
</changes>
```

## Specific Features
1.  **Industrial:** `recharts` for Dairy Production metrics.
2.  **Hospitality:** Dynamic pricing simulator for Revenue Manager.
3.  **Retail:** Natural language query interface for Smart POS.

## Aesthetic Mandate
UI must feel premium and cinematic with glowing borders and active scanline effects.
