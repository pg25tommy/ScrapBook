import { create } from 'zustand';

/* ---------------- Types ---------------- */

export type SlotContent =
  | { kind: 'image'; src: string; fit?: 'contain' | 'cover' }
  | { kind: 'text'; text: string };

export type Slot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scale?: number;
  content?: SlotContent;
  backText?: string;  // Text on the back of the photo
};

/* ---------------- Helpers ---------------- */

function uid() { return Math.random().toString(36).slice(2); }

const STORAGE_KEY = 'light-table-slot-v1';

const ONE_SLOT: Slot = {
  id: uid(),
  x: 0,
  y: 0,
  width: 520,
  height: 420,
  rotation: 0,
  scale: 1,
  content: undefined,
};

// Helper to save slot to localStorage
function saveSlotToStorage(slot: Slot) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slot));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// Helper to load slot from localStorage
function loadSlotFromStorage(): Slot | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
    return null;
  }
}

/* ---------------- Store ---------------- */

type LTState = {
  // Single Polaroid frame state
  slot: Slot;
  loupeEnabled: boolean;
  isFlipped: boolean;

  /* Photo frame controls */
  setSlotContent: (content: SlotContent | undefined) => void;
  setBackText: (text: string) => void;
  resizeSlot: (w: number, h: number) => void;
  resetSlot: () => void;

  /* Camera controls */
  toggleLoupe: () => void;
  toggleFlip: () => void;

  /* Persistence */
  loadFromStorage: () => void;
};

export const useLightTableStore = create<LTState>((set) => ({
  /* single polaroid frame */
  slot: ONE_SLOT,
  loupeEnabled: false,
  isFlipped: false,

  /* photo frame */
  setSlotContent: (content) => {
    set(({ slot }) => {
      const newSlot = { ...slot, content };
      saveSlotToStorage(newSlot);
      return { slot: newSlot };
    });
  },

  setBackText: (text) => {
    set(({ slot }) => {
      const newSlot = { ...slot, backText: text };
      saveSlotToStorage(newSlot);
      return { slot: newSlot };
    });
  },

  resizeSlot: (w, h) =>
    set(({ slot }) => ({ slot: { ...slot, width: w, height: h } })),

  resetSlot: () => {
    const newSlot = { ...ONE_SLOT, id: uid() };
    saveSlotToStorage(newSlot);
    set({
      slot: newSlot,
      isFlipped: false,
    });
  },

  /* camera controls */
  toggleLoupe: () => set((s) => ({ loupeEnabled: !s.loupeEnabled })),
  toggleFlip: () => set((s) => ({ isFlipped: !s.isFlipped })),

  /* persistence */
  loadFromStorage: () => {
    const savedSlot = loadSlotFromStorage();
    if (savedSlot) {
      set({ slot: savedSlot });
    }
  },
}));