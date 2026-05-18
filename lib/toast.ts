import { create } from "zustand";

interface ToastState {
  // Tick changes on every show() even with the same string, so the GlobalToast
  // re-animates when the same message fires back-to-back (e.g. two deletes).
  message: string | null;
  tick: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  tick: 0,
  show: (message) => set({ message, tick: get().tick + 1 }),
  hide: () => set({ message: null }),
}));

export function toast(message: string): void {
  useToastStore.getState().show(message);
}
