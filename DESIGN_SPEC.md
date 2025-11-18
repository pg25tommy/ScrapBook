# Light Table – Design & Look-and-Feel Spec

**version:** 0.1
**owner:** Tommy Minter
**project:** Light Table (Scrapbook Web App)
**document type:** Design Philosophy / Visual Language

---

## 1. Design Intent

The Light Table interface should evoke the feeling of sitting at a real analog light-table covered in scrapbook pages, tape, paper scraps, and tactile memories.

The visual identity blends:

- **Warm, analog tactility**
- **Modern UI clarity**
- **Vintage scrapbook charm**
- **Deep earth-tone palette** for atmosphere and mood

The goal is to create a digital space that feels **hand-touched** yet still behaves like a clean, intuitive modern web interface.

---

## 2. Core Aesthetic Themes

### 2.1 Analog Warmth

- Soft paper textures with visible fibers
- Gentle falloff lighting, like a dim lamp over your workspace
- Slight vignette around edges
- Imperfect elements: frayed tape edges, subtle grain, slight shadows

### 2.2 Scrapbook Tactility

- Polaroid-style frames
- Torn paper edges or deckled edges
- Masking tape pieces (SVG, slightly irregular)
- Layered elements that visually "stack"
- Everything looks **placed by hand**

### 2.3 Deep Earth Tone Palette

Use warm, grounded, slightly muted tones:

- Creams, parchment, off-white
- Warm browns, tan, sepia
- Deep forest green
- Dark umber, charcoal
- Occasional brass, aged gold accents

The palette should feel **nostalgic, cozy, and human** — but never muddy or heavy.

---

## 3. Modern / Vintage Blend

The UI must feel **modern in usability** but **vintage in styling**.

### Modern UI traits:

- Clean icons
- Smooth transitions
- Responsive scaling
- Minimal chrome
- Clear hierarchy
- Good accessibility and contrast

### Vintage visual traits:

- Textures on backgrounds and frames
- Handmade imperfections
- Slightly organic spacing
- Paper shadows and lifted elements
- Warm light and soft gradients

**Think:** Apple Notes (2021) meets analog photography meets a designer's wooden desk.

---

## 4. Interaction Feel

Interactions should feel **gentle, physical, soft**.

### 4.1 Zoom & Pan

- Smooth easing
- Inertia like you're sliding a physical page
- Zoom should feel like a lens or loupe, not a digital scale

### 4.2 Hover States

- Slight warm highlight
- Soft shadow lift
- No harsh neon or pure white

### 4.3 Dragging

Dragging a photo or tape piece should feel like you're dragging a real object:

- Subtle shadow changes
- Slight rotation variance
- No snapping unless requested by the user

---

## 5. Light Table Surface

The "table" itself is a key part of the identity.

### 5.1 Surface Material

- A muted cream or warm parchment
- Soft mottled paper grain
- Gentle illuminated center (like a real light table)
- A vignette to anchor focus in the middle

### 5.2 Depth + Layers

Everything feels like it's sitting **on** the table:

- Soft physical shadows
- Layer overlaps
- Tape sits "above" the Polaroid
- UI toolbar sits cleanly on top without texture

---

## 6. Polaroid Frame Style

The Polaroid frame is the **hero element**.

### Requirements:

- Matte white slightly aged (not pure white)
- Fine grain texture
- Realistic shadow
- Slight warp imperfection
- Option for hand-written caption area

The photograph inside should feel like it was **gently dropped onto the surface**.

---

## 7. Tape & Fasteners

Tape is part of the visual identity.

### Tape characteristics:

- Imperfect edges
- Transparent yellowish tone
- Slight wrinkle or bubble
- Works as SVG texture overlays
- Never symmetrical

### Optional additional fasteners:

- Photo corners
- Binder clips (minimal use)
- Paperclips (thin, brushed metal)

---

## 8. Typography

Typography must bridge **analog warmth** and **modern clarity**.

### Body/UI Font

A modern sans-serif with humanist tone (Inter, Source Sans, or SF Pro)

### Decorative / Labels

Subtle handwritten or script font for small captions
(Never for UI, only for Polaroid captions)

### Tone

- Soft black or deep brown — never pure black
- Slight letter-spacing to feel "airier"
- Very gentle text shadow allowed for warmth

---

## 9. Motion / Animation Philosophy

Animations should feel **invisible but present**:

- 150–250ms range
- Ease-out curves
- Light elastic feel on drag-release
- No aggressive overshoots
- Subtle masking fade-in effects

Everything should feel **alive but calm**.

---

## 10. UI Chrome Philosophy

Minimal but warm.

### Toolbar & Buttons:

- Flat modern design
- Soft rounded corners
- Earth-tone hover states
- Slight paper grain overlay (1–3% opacity)
- Icons should be thin-line, modern, monochrome

### Modals & Menus:

- Centered card with subtle drop shadow
- Slight parchment tint
- High readability without losing warmth

---

## 11. Atmosphere Summary (One Sentence)

**"A warm analog scrapbook laid over a modern interface — nostalgic, tactile, deeply human, but clean, clear, and easy to use."**

---

## 12. Deliverable Targets for Claude

Claude should use this document to:

- Generate UI mockups in vintage + modern hybrid style
- Produce palette options in deep-earth tones
- Create tape textures, paper textures, and Polaroid frames
- Offer layout suggestions that honor analog spacing
- Avoid sterile or overly glossy aesthetics
- Maintain tactility while ensuring modern functionality