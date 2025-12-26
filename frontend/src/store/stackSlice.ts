import { create } from "zustand";

export interface Stack {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StackState {
  stacks: Stack[];
  currentStack: Stack | null;
  setStacks: (stacks: Stack[]) => void;
  addStack: (stack: Stack) => void;
  setCurrentStack: (stack: Stack | null) => void;
  deleteStack: (id: string) => void;
}

export const useStackStore = create<StackState>((set) => ({
  stacks: [],
  currentStack: null,
  setStacks: (stacks) => set({ stacks }),
  addStack: (stack) => set((state) => ({ stacks: [...state.stacks, stack] })),
  setCurrentStack: (stack) => set({ currentStack: stack }),
  deleteStack: (id) => set((state) => ({ stacks: state.stacks.filter((s) => s.id !== id) })),
}));
