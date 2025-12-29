import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Stack {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  workflows?: SavedWorkflow[];
}

export interface SavedWorkflow {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface StackState {
  stacks: Stack[];
  currentStack: Stack | null;
  setStacks: (stacks: Stack[]) => void;
  addStack: (stack: Stack) => void;
  updateStack: (id: string, updates: Partial<Stack>) => void;
  setCurrentStack: (stack: Stack | null) => void;
  deleteStack: (id: string) => void;
  addWorkflowToStack: (stackId: string, workflow: SavedWorkflow) => void;
  updateWorkflowInStack: (stackId: string, workflowId: string, updates: Partial<SavedWorkflow>) => void;
  deleteWorkflowFromStack: (stackId: string, workflowId: string) => void;
}

export const useStackStore = create<StackState>()(
  persist(
    (set) => ({
      stacks: [],
      currentStack: null,
      
      setStacks: (stacks) => set({ stacks }),
      
      addStack: (stack) => set((state) => ({ 
        stacks: [...state.stacks, { ...stack, workflows: [] }] 
      })),
      
      updateStack: (id, updates) => set((state) => ({
        stacks: state.stacks.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
        currentStack: state.currentStack?.id === id 
          ? { ...state.currentStack, ...updates }
          : state.currentStack,
      })),
      
      setCurrentStack: (stack) => set({ currentStack: stack }),
      
      deleteStack: (id) => set((state) => ({ 
        stacks: state.stacks.filter((s) => s.id !== id),
        currentStack: state.currentStack?.id === id ? null : state.currentStack,
      })),

      addWorkflowToStack: (stackId, workflow) => set((state) => ({
        stacks: state.stacks.map((s) =>
          s.id === stackId 
            ? { ...s, workflows: [...(s.workflows || []), workflow] }
            : s
        ),
      })),

      updateWorkflowInStack: (stackId, workflowId, updates) => set((state) => ({
        stacks: state.stacks.map((s) =>
          s.id === stackId 
            ? {
                ...s,
                workflows: (s.workflows || []).map((w) =>
                  w.id === workflowId ? { ...w, ...updates } : w
                ),
              }
            : s
        ),
      })),

      deleteWorkflowFromStack: (stackId, workflowId) => set((state) => ({
        stacks: state.stacks.map((s) =>
          s.id === stackId 
            ? { ...s, workflows: (s.workflows || []).filter((w) => w.id !== workflowId) }
            : s
        ),
      })),
    }),
    {
      name: "askyia-stacks",
    }
  )
);