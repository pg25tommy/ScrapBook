# Light Table — Scrapbook Web App

**Version:** 0.4
**Owner:** Tommy Minter
**Status:** Active

## Overview

Light Table is a tactile, analog-feeling scrapbook web app that displays a single Polaroid-style image on a warm paper background. The aesthetic is physical and intimate: matte textures, soft shadows, tape overlays, and gentle light-table vibes.

Content loads from an API endpoint and can be swapped later for Supabase storage.

---

## Features

### Display
- Single Polaroid frame centered on a cream paper background
- Frame includes:
  - Realistic matte texture
  - Drop shadow
  - Masked content region
  - Decorative tape pieces on top layer (never masked)

### Interaction
- **Mouse wheel zoom** (0.5x to 3.0x)
- **Click-and-drag panning** on background
- **Click frame** to cycle through images
- **Toolbar controls:**
  - Next Photo: Load next image from API
  - Toggle Loupe: Enable/disable magnification (placeholder for future implementation)
  - Reset View: Return camera to default zoom/pan
  - Load External: Refresh image pool from external sources

### Data Loading
- `/api/page` returns one or more image URLs
- All remote URLs wrapped via `/api/proxy?url=...` for CORS safety
- Future support for:
  - Date-based pages
  - Supabase Storage public URLs

### Style & Mood
- Warm, creamy paper texture across full viewport
- No animated backgrounds
- Tape style: beige, ragged, slightly translucent
- Buttons: pill shapes with soft shadows

---

## Tech Stack

- **Next.js 15.5** (App Router)
- **React 19.1** + **TypeScript 5**
- **PixiJS 8.12** for high-performance 2D graphics
- **Zustand 5.0** for lightweight state management
- **Tailwind CSS 4** for styling
- **Vitest 3.2** + Testing Library for testing

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd light-table

# Install dependencies
npm install
```

### Development

```bash
# Run development server
npm run dev

# Or with Turbo disabled (for Windows stability)
npm run dev -- --no-turbo
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
# Build for production
npm run build

# Run production server
npm start
```

### Testing

```bash
# Run test suite
npm test
```

### Linting

```bash
# Check code quality
npm run lint
```

---

## Project Structure

```
light-table/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── page/route.ts        # Image pool API
│   │   │   └── proxy/route.ts       # CORS proxy
│   │   ├── components/
│   │   │   └── LightTableApp.tsx    # Main UI component
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Entry point
│   │   └── globals.css              # Global styles
│   ├── lib/pixi/
│   │   ├── engine.ts                # PixiJS graphics engine
│   │   ├── tapeTextures.ts          # Tape SVG assets
│   │   ├── compat.ts                # PixiJS compatibility layer
│   │   └── utils.ts                 # Texture utilities
│   ├── state/
│   │   └── useLightTableStore.ts    # Zustand state store
│   └── tests/
│       └── compat.test.ts           # Unit tests
├── public/
│   ├── photos/                      # Local image directory
│   └── textures/                    # Paper texture assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
└── SPEC.md                          # Technical specification
```

---

## Usage

### Adding Local Photos

1. Place image files (JPG, PNG, etc.) in `/public/photos/`
2. Click "Next Photo" or click the frame to cycle through images
3. Images are loaded randomly from the pool

### Loading External Images

- Click "Load External" to fetch images from preconfigured sources (Unsplash, Pexels)
- External images are automatically proxied through `/api/proxy` to avoid CORS issues

### Camera Controls

- **Zoom:** Scroll mouse wheel while hovering over the canvas
- **Pan:** Click and drag on the background (not on the frame)
- **Reset:** Click "Reset View" to return to default position and zoom
- **Cycle Images:** Click on the Polaroid frame or use "Next Photo" button

---

## API Endpoints

### `GET /api/page`

Returns image URL(s) from the pool.

**Query Parameters:**
- `pool` (optional): `'local'`, `'external'`, or `'any'` (default: `'any'`)
- `index` (optional): Specific index for deterministic cycling

**Response:**
```json
{
  "slot": {
    "kind": "image",
    "src": "https://images.unsplash.com/photo-...",
    "fit": "cover"
  }
}
```

### `GET /api/proxy`

CORS-safe proxy for external images.

**Query Parameters:**
- `url` (required): The external image URL to fetch

**Allowed Hosts:**
- `images.unsplash.com`
- `images.pexels.com`

---

## Constraints & Design Decisions

- **Do NOT animate the background** - Maintains analog aesthetic
- **Do NOT mask the entire frame** - Only the photo opening is masked; tape must sit above mask
- **Toolbar must always remain visible** - Ensured via safe insets
- **No blocking prompts** - All actions are instant (no animations on camera reset)
- **External images must go through `/api/proxy`** - Security and CORS compliance

---

## Troubleshooting

### Turbo Cache Issues
If you encounter cache-related build errors:
```bash
# Delete cache and rebuild
rm -rf .next
npm run dev -- --no-turbo
```

### CORS Failures
If external images fail to load:
- Ensure the URL is passed through `/api/proxy?url=<encoded-url>`
- Check that the host is in the allowed list in `src/app/api/proxy/route.ts`

### Frame Masking Issues
If tape appears masked incorrectly:
- Tape sprites must have `zIndex: 50` to sit above the mask
- Only the photo opening (`__opening__` Graphics object) should be used as mask

---

## Roadmap

### Current (v0.4)
- ✅ Single Polaroid frame display
- ✅ Zoom & pan controls
- ✅ CORS-safe image loading
- ✅ Simplified toolbar (4 buttons)
- ✅ Reset camera view
- 🔨 Loupe magnification (placeholder, needs implementation)

### Future
- Supabase Storage integration
- Date-based page navigation
- Multi-photo layouts
- Text annotations/clippings
- Social sharing
- Mobile touch gestures optimization

---

## Contributing

This is a personal project by Tommy Minter. For questions or feedback, please refer to the [SPEC.md](SPEC.md) file for technical details.

---

## License

All rights reserved.