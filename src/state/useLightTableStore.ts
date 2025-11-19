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
  // Multiple slots on the page
  slots: Slot[];
  currentSlotIndex: number;
  loupeEnabled: boolean;
  isFlipped: boolean;

  // Computed: current slot (for backward compatibility)
  slot: Slot;

  /* Slot management */
  addSlot: (content?: SlotContent) => void;
  removeCurrentSlot: () => void;
  setCurrentSlot: (index: number) => void;
  nextSlot: () => void;
  prevSlot: () => void;

  /* Photo frame controls */
  setSlotContent: (content: SlotContent | undefined) => void;
  setBackText: (text: string) => void;
  resizeSlot: (w: number, h: number) => void;
  resetSlot: () => void;
  updateSlotPosition: (index: number, x: number, y: number) => void;

  /* Camera controls */
  toggleLoupe: () => void;
  toggleFlip: () => void;

  /* Persistence */
  loadFromStorage: () => void;
  resetStore: () => void;
};

export const useLightTableStore = create<LTState>((set, get) => ({
  /* multiple slots */
  slots: [ONE_SLOT],
  currentSlotIndex: 0,
  loupeEnabled: false,
  isFlipped: false,

  // Computed property for backward compatibility
  get slot() {
    return get().slots[get().currentSlotIndex] || ONE_SLOT;
  },

  /* slot management */
  addSlot: (content) => {
    set((state) => {
      // Position new slots with larger offset so they don't overlap
      const offset = state.slots.length * 150;
      const newSlot: Slot = {
        id: uid(),
        x: offset,
        y: offset,
        width: 520,
        height: 420,
        rotation: 0,
        scale: 1,
        content,
      };
      const newSlots = [...state.slots, newSlot];
      saveSlotToStorage(newSlot); // Save the new slot
      return {
        slots: newSlots,
        currentSlotIndex: newSlots.length - 1, // Switch to the new slot
        isFlipped: false,
      };
    });
  },

  removeCurrentSlot: () => {
    set((state) => {
      if (state.slots.length <= 1) return {}; // Keep at least one slot
      const newSlots = state.slots.filter((_, i) => i !== state.currentSlotIndex);
      const newIndex = Math.min(state.currentSlotIndex, newSlots.length - 1);
      saveSlotToStorage(newSlots[newIndex]);
      return {
        slots: newSlots,
        currentSlotIndex: newIndex,
        isFlipped: false,
      };
    });
  },

  setCurrentSlot: (index) => {
    set((state) => {
      if (index >= 0 && index < state.slots.length) {
        return {
          currentSlotIndex: index,
          isFlipped: false,
        };
      }
      return {};
    });
  },

  nextSlot: () => {
    set((state) => ({
      currentSlotIndex: (state.currentSlotIndex + 1) % state.slots.length,
      isFlipped: false,
    }));
  },

  prevSlot: () => {
    set((state) => ({
      currentSlotIndex: (state.currentSlotIndex - 1 + state.slots.length) % state.slots.length,
      isFlipped: false,
    }));
  },

  /* photo frame */
  setSlotContent: (content) => {
    set((state) => {
      const newSlots = [...state.slots];
      newSlots[state.currentSlotIndex] = {
        ...newSlots[state.currentSlotIndex],
        content,
      };
      saveSlotToStorage(newSlots[state.currentSlotIndex]);
      return { slots: newSlots };
    });
  },

  setBackText: (text) => {
    set((state) => {
      const newSlots = [...state.slots];
      newSlots[state.currentSlotIndex] = {
        ...newSlots[state.currentSlotIndex],
        backText: text,
      };
      saveSlotToStorage(newSlots[state.currentSlotIndex]);
      return { slots: newSlots };
    });
  },

  resizeSlot: (w, h) => {
    set((state) => {
      const newSlots = [...state.slots];
      newSlots[state.currentSlotIndex] = {
        ...newSlots[state.currentSlotIndex],
        width: w,
        height: h,
      };
      return { slots: newSlots };
    });
  },

  resetSlot: () => {
    set((state) => {
      const newSlots = [...state.slots];
      newSlots[state.currentSlotIndex] = { ...ONE_SLOT, id: uid() };
      saveSlotToStorage(newSlots[state.currentSlotIndex]);
      return {
        slots: newSlots,
        isFlipped: false,
      };
    });
  },

  updateSlotPosition: (index, x, y) => {
    set((state) => {
      const newSlots = [...state.slots];
      newSlots[index] = {
        ...newSlots[index],
        x,
        y,
      };
      return { slots: newSlots };
    });
  },

  /* camera controls */
  toggleLoupe: () => set((s) => ({ loupeEnabled: !s.loupeEnabled })),
  toggleFlip: () => set((s) => ({ isFlipped: !s.isFlipped })),

  /* persistence */
  loadFromStorage: () => {
    const savedSlot = loadSlotFromStorage();
    if (savedSlot) {
      set({ slots: [savedSlot], currentSlotIndex: 0 });
    }
  },

  resetStore: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({
      slots: [{ ...ONE_SLOT, id: uid() }],
      currentSlotIndex: 0,
      loupeEnabled: false,
      isFlipped: false,
    });
  },
}));