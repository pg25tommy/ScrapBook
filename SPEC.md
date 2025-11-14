# Light Table — Technical Specification
version: 0.4.1
date: 2025-11-14
status: Alignment in Progress + NEW Flip Feature Added

## Current State vs Goals Analysis

### ✅ Aligned Features
- **Zoom & Pan**: Mouse wheel zoom and click-drag panning work smoothly
- **Paper Background**: Warm, cream-textured background implemented
- **CORS Proxy**: `/api/proxy` route handles external images correctly
- **Tape Overlays**: SVG tape pieces rendered on top layer (not masked)
- **Toolbar**: Persistent toolbar with controls
- **PixiJS Integration**: High-performance 2D rendering with PixiJS 8.x
- **TypeScript**: Full type safety throughout codebase
- **API Endpoint**: `/api/page` provides image URLs
- **Photo Flip**: ✅ NEW - Flip photo to add text on back (newspaper clipping style)

### ❌ Misaligned Features (Need Removal)
- **Multiple Slots**: Current implementation supports multiple photo frames, spec calls for single Polaroid
- **Clippings System**: Text clippings feature not in spec (292 lines in store)
- **Date-based Pages**: Full scrapbook history system with save/load/delete not in v0.4 spec
- **Fit Mode Toggle**: `contain` vs `cover` toggle not specified in goals

### 🔨 Missing Features (Need Implementation)
- **Loupe Magnification**: Toggle for magnified viewing not implemented
- **Reset Camera View**: Dedicated button to reset zoom/pan state
- **Offline Demo Mode**: No explicit offline-first approach documented
- **Supabase Integration**: Placeholder for future Supabase Storage support

### 🐛 Technical Issues (Need Fixing)
- **Duplicate File**: `src/lib/pixi/visulas.ts` duplicates `utils.ts`
- **Unused Dependency**: `framer-motion` in package.json but never used
- **Magic Numbers**: Hard-coded dimensions scattered throughout
- **Test Coverage**: Minimal tests (only 21 lines)
- **Generic README**: Documentation doesn't reflect Light Table specifics

---

## Architecture Overview

### Current Structure
```
src/
├── app/
│   ├── api/
│   │   ├── page/route.ts          # Image pool API ✅
│   │   └── proxy/route.ts         # CORS proxy ✅
│   ├── components/
│   │   └── LightTableApp.tsx      # Main UI (319 lines)
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Entry point
│   └── globals.css                # Global styles ✅
├── lib/pixi/
│   ├── engine.ts                  # Graphics engine (433 lines)
│   ├── tapeTextures.ts            # Tape SVG assets ✅
│   ├── compat.ts                  # PIXI compatibility
│   ├── utils.ts                   # Texture utilities
│   └── visulas.ts                 # ❌ DUPLICATE - DELETE
├── state/
│   └── useLightTableStore.ts      # Zustand store (292 lines)
└── tests/
    └── compat.test.ts             # Unit tests
```

### Data Models

#### Current (Overengineered)
```typescript
interface Slot {
  id: string;
  imageURL?: string;
  fitMode: 'contain' | 'cover';
  textContent?: string;
  x: number;
  y: number;
}

interface Clipping {
  id: string;
  text: string;
  x: number;
  y: number;
}

interface Page {
  id: string;
  date: string;
  slots: Slot[];
  clippings: Clipping[];
}
```

#### Target (Simplified + Flip Feature)
```typescript
interface Slot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scale?: number;
  content?: SlotContent;
  backText?: string;  // NEW: Text on the back of the photo
}

interface PageState {
  slot: Slot;
  loupeEnabled: boolean;
  isFlipped: boolean;  // NEW: Whether photo is flipped to show back
}
```

---

## Feature Specifications

### 1. Single Polaroid Frame ✅ (Needs Simplification)
**Status**: Partially implemented (currently multi-slot)

**Requirements**:
- Display exactly ONE Polaroid-style frame
- Frame dimensions: ~800x900px (adjustable)
- Frame structure (bottom to top):
  1. Drop shadow layer
  2. White matte border (~60px all sides, ~80px bottom)
  3. Photo opening (masked content region)
  4. Tape pieces (2-3 strips, beige, ragged edges) - NEVER masked

**Implementation Notes**:
- Use PIXI.Graphics for frame border
- Apply mask to photo content only
- Tape rendered as separate sprites above frame

**Current Issues**:
- Multi-slot system allows multiple frames
- Slots stored in array rather than single state

**Action Required**:
- Remove slot array logic
- Simplify state to single image URL
- Remove slot creation/deletion code

---

### 2. Zoom & Pan ✅
**Status**: Fully implemented

**Requirements**:
- Mouse wheel: zoom in/out (0.5x to 3.0x range)
- Click-drag on background: pan camera
- Toolbar must remain accessible at all zoom levels

**Implementation**:
- PIXI viewport transforms working correctly
- Safe insets ensure toolbar visibility
- Smooth interpolation on zoom

**No action required**.

---

### 3. Toolbar Controls 🔨
**Status**: Partially implemented

**Current Buttons**:
- ✅ "Cycle Image" (Next Photo)
- ❌ "Toggle Fit" (not in spec)
- ❌ Date navigation (not in v0.4 spec)
- ❌ Lock Clippings (not in spec)
- ❌ Add Clipping (not in spec)

**Required Buttons** (per goals doc):
1. **Cycle Page Image**: Load next image from `/api/page` ✅
2. **Toggle Loupe**: Enable/disable magnification ❌ MISSING
3. **Reset Camera**: Return to default zoom/pan ❌ MISSING
4. **Load External Index**: Refresh image pool from API ✅ (partially)

**Action Required**:
- Remove: fit mode toggle, date controls, clipping buttons
- Add: loupe toggle button
- Add: reset camera button
- Simplify toolbar to 4 buttons max

---

### 4. CORS Proxy ✅
**Status**: Fully implemented

**Implementation**: [src/app/api/proxy/route.ts](src/app/api/proxy/route.ts)
- Validates allowed hosts (whitelist approach)
- Fetches external images server-side
- Returns binary data with proper content-type

**Allowed Hosts**:
- `images.unsplash.com`
- `images.pexels.com`

**Action Required**: None, working as specified.

---

### 5. Visual Style ✅
**Status**: Fully aligned

**Requirements**:
- Warm cream paper texture: ✅ Implemented in [src/app/globals.css](src/app/globals.css)
- NO animated backgrounds: ✅ Confirmed
- Matte textures on frame: ✅ Drop shadow and texture applied
- Beige ragged tape: ✅ SVG tape in [src/lib/pixi/tapeTextures.ts](src/lib/pixi/tapeTextures.ts)
- Soft shadows on buttons: ✅ CSS styling applied

**Action Required**: None, visual style matches spec.

---

### 6. Image Loading ✅
**Status**: Fully implemented

**Flow**:
1. UI requests image via toolbar click
2. Store fetches from `/api/page`
3. API returns URL(s) from hardcoded pool or future Supabase
4. If external, wrap via `/api/proxy?url=...`
5. PIXI texture loader fetches with CORS headers

**Current API Response** [src/app/api/page/route.ts:17-32](src/app/api/page/route.ts#L17-L32):
```json
[
  "https://images.unsplash.com/photo-...",
  "/photos/local-image.jpg"
]
```

**Action Required**: None, working correctly.

---

### 7. Loupe Magnification ❌
**Status**: NOT IMPLEMENTED

**Requirements**:
- Toolbar button to toggle loupe mode
- When enabled, show magnified circular region around cursor
- Magnification: 2x or 3x the current zoom
- Loupe should be a circular overlay with soft edge

**Implementation Plan**:
1. Add `loupeEnabled` boolean to state
2. Add toolbar button with magnifying glass icon
3. In engine.ts, add loupe rendering:
   - Track mouse position
   - Render circular mask region
   - Scale texture under loupe independently
   - Use PIXI.Graphics + mask for circular cutout

**Estimated Complexity**: Medium (2-3 hours)

---

### 8. Reset Camera View ❌
**Status**: NOT IMPLEMENTED

**Requirements**:
- Toolbar button to reset zoom to 1.0 and pan to center
- Instant snap (no animation per "no blocking prompts" constraint)
- Button icon: target/crosshair or "center" symbol

**Implementation Plan**:
1. Add button to toolbar in [src/app/components/LightTableApp.tsx](src/app/components/LightTableApp.tsx)
2. In engine, expose `resetCamera()` method
3. Reset `cameraZoom` to 1.0, `cameraPosition` to (0, 0)
4. Call `updateWorldTransform()` to apply instantly

**Estimated Complexity**: Low (30 minutes)

---

### 9. Photo Flip & Back Text ✅
**Status**: FULLY IMPLEMENTED (NEW FEATURE)

**Requirements**:
- Toolbar button to flip Polaroid photo to see/edit back
- When flipped, show aged paper background with text
- Double-click flipped photo to open text editor
- Text persists to localStorage
- Newspaper clipping aesthetic (Georgia serif font, centered)

**Implementation** [src/app/components/LightTableApp.tsx](src/app/components/LightTableApp.tsx):
1. **State Management**:
   - `isFlipped: boolean` - tracks flip state
   - `slot.backText?: string` - stores text on back
   - `toggleFlip()` - action to flip photo
   - `setBackText(text: string)` - persists text to localStorage

2. **UI Components**:
   - Flip button in toolbar (`🔄 Flip Over` / `🔄 Show Front`)
   - Modal text editor with Georgia font styling
   - Keyboard shortcuts: Esc to cancel, Ctrl+Enter to save
   - Debounced double-click to prevent spam

3. **Rendering** [src/lib/pixi/engine.ts:100-118](src/lib/pixi/engine.ts#L100-L118):
   - When `isFlipped=true`, render cream-colored background (0xf5f3ed)
   - Render text with Georgia serif, 18px, dark gray (0x2a2a2a)
   - Text positioned at center, offset for bottom border
   - NO masking on back (text doesn't need clipping)
   - Tape pieces still visible with zIndex: 50

4. **Persistence**:
   - Auto-save to localStorage on every text change
   - Storage key: `'light-table-slot-v1'`
   - Loads saved backText on mount

**Interaction Flow**:
1. User clicks "Flip Over" button
2. Photo flips to show cream-colored back with text or placeholder
3. User double-clicks flipped photo
4. Modal editor appears with existing text
5. User types text and hits Ctrl+Enter or clicks Save
6. Text renders on back immediately
7. User clicks "Show Front" to return to photo

**Technical Details**:
- `makeBackgroundForFlipped()` creates cream Graphics rectangle
- `makeBackContent()` creates PIXI.Text with newspaper styling
- Both added to container without masking (tape overlays still work)
- Text wrapping: 520px - 40px = 480px max width
- Line height: 24px for readability

**No action required** - Feature complete and working.

---

### 10. Data Persistence
**Status**: Overengineered for v0.4

**Current**: Full localStorage-backed scrapbook with:
- Multiple saved pages by date
- Clippings persistence
- Multi-slot state

**v0.4 Requirement**:
- Simple session state (no explicit persistence mentioned)
- Future: Supabase Storage for image URLs

**Action Required**:
- Remove date-based page save/load/delete system
- Remove localStorage persistence (or simplify to current image only)
- Add comments for future Supabase integration points

---

## Gap Analysis Summary

| Feature | Current | v0.4 Goal | Action |
|---------|---------|-----------|--------|
| Frame Count | Multiple slots | Single Polaroid | Simplify |
| Clippings | Full system (292 LOC) | None | Remove |
| Page History | Date-based saves | None | Remove |
| Loupe | Not present | Required | Add |
| Reset Camera | Not present | Required | Add |
| **Photo Flip** | ✅ **IMPLEMENTED** | **NEW Feature** | **Keep** |
| **Back Text** | ✅ **IMPLEMENTED** | **NEW Feature** | **Keep** |
| Fit Mode Toggle | Present | Not specified | Remove |
| Zoom & Pan | ✅ Working | Required | Keep |
| CORS Proxy | ✅ Working | Required | Keep |
| Tape Overlays | ✅ Working | Required | Keep |
| Paper Texture | ✅ Working | Required | Keep |

---

## Refactoring Plan

### Phase 1: Cleanup (Low Risk)
1. ✅ Delete `src/lib/pixi/visulas.ts`
2. ✅ Remove `framer-motion` from package.json
3. ✅ Update README with project-specific docs

### Phase 2: Feature Removal (Medium Risk)
4. Remove clippings system:
   - Delete clipping-related state in [src/state/useLightTableStore.ts](src/state/useLightTableStore.ts)
   - Remove clipping rendering in [src/lib/pixi/engine.ts](src/lib/pixi/engine.ts)
   - Remove clipping UI controls from [src/app/components/LightTableApp.tsx](src/app/components/LightTableApp.tsx)

5. Remove page history system:
   - Delete `savedPages` state
   - Remove date navigation UI
   - Remove save/load/delete actions
   - Simplify or remove localStorage

6. Simplify to single frame:
   - Change `slots: Slot[]` → `currentImage: string`
   - Remove slot array logic
   - Keep single Polaroid frame rendering

### Phase 3: Feature Addition (Medium Risk)
7. Add loupe magnification:
   - Add `loupeEnabled` state
   - Add toolbar button
   - Implement circular magnification in engine

8. Add reset camera button:
   - Add toolbar button
   - Implement reset logic in engine

### Phase 4: Testing (Low Risk)
9. Manual testing of all features
10. Update/add automated tests
11. Production build verification

---

## Testing Checklist

### Pre-Alignment (Current State)
- [x] Zoom in/out with mouse wheel
- [x] Pan by dragging background
- [x] Click frame to cycle images
- [x] External images load through proxy
- [x] Toolbar remains visible at all zoom levels
- [x] Tape pieces render above frame (not masked)

### Post-Alignment (Target State)
- [ ] Single Polaroid frame displays
- [ ] Zoom & pan still work smoothly
- [ ] Click frame cycles to next image from `/api/page`
- [ ] Toggle loupe shows magnified circular region
- [ ] Reset camera returns to default view
- [x] **Flip button flips photo to show back**
- [x] **Double-click flipped photo opens text editor**
- [x] **Text persists to localStorage**
- [x] **Text renders on cream background with newspaper styling**
- [x] **Tape pieces visible on both front and back**
- [ ] No clippings UI visible
- [ ] No date navigation UI visible
- [ ] Production build runs without errors
- [ ] No console errors or warnings
- [ ] External image loads through proxy successfully

---

## Acceptance Criteria (v0.4)

Per goals document:
- ✅ App loads a Polaroid frame with tape pieces
- ✅ Zoom & pan work smoothly
- ✅ Frame click cycles images via `/api/page`
- ✅ External host images work through proxy (no CORS issues)
- ✅ **NEW: Flip photo to add text on back (newspaper clipping aesthetic)**
- ✅ **NEW: Double-click flipped photo to edit text**
- ✅ **NEW: Text persists to localStorage**
- 🔨 Toggle loupe magnification (TO ADD)
- 🔨 Reset camera view button (TO ADD)
- ❌ No clippings system (TO REMOVE)
- ❌ No page history (TO REMOVE)
- ✅ Production build runs locally and reliably

---

## Notes for Future Phases

### Post-v0.4 Features (Out of Scope)
- Supabase Storage integration
- Date-based page navigation
- Multi-photo layouts
- Text annotations/clippings
- Social sharing
- Mobile touch gestures

### Technical Debt
- Extract magic numbers to constants file
- Improve TypeScript coverage (reduce `any` casts)
- Expand test suite beyond compat helpers
- Add integration tests with Playwright
- Performance profiling with large images

---

## References
- Goals Document: `README` (version 0.4)
- Main Component: [src/app/components/LightTableApp.tsx](src/app/components/LightTableApp.tsx)
- Graphics Engine: [src/lib/pixi/engine.ts](src/lib/pixi/engine.ts)
- State Store: [src/state/useLightTableStore.ts](src/state/useLightTableStore.ts)
- CORS Proxy: [src/app/api/proxy/route.ts](src/app/api/proxy/route.ts)
- Image API: [src/app/api/page/route.ts](src/app/api/page/route.ts)
