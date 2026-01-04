import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LLMProvider } from "../types/llm.types";

interface ApiKeysState {
  keys: Partial<Record<LLMProvider, string>>;
  setApiKey: (provider: LLMProvider, key: string) => void;
  getApiKey: (provider: LLMProvider) => string | undefined;
  removeApiKey: (provider: LLMProvider) => void;
  hasApiKey: (provider: LLMProvider) => boolean;
  clearAllKeys: () => void;
}

export const useApiKeysStore = create<ApiKeysState>()(
  persist(
    (set, get) => ({
      keys: {},

      setApiKey: (provider: LLMProvider, key: string) => {
        set((state) => ({
          keys: { ...state.keys, [provider]: key },
        }));
      },

      getApiKey: (provider: LLMProvider) => {
        return get().keys[provider];
      },

      removeApiKey: (provider: LLMProvider) => {
        set((state) => {
          const newKeys = { ...state.keys };
          delete newKeys[provider];
          return { keys: newKeys };
        });
      },

      hasApiKey: (provider: LLMProvider) => {
        const key = get().keys[provider];
        return !!key && key.length > 0;
      },

      clearAllKeys: () => {
        set({ keys: {} });
      },
    }),
    {
      name: "askyia-api-keys",
      // Don't persist to localStorage in production - use secure storage
      // This is for development convenience
    }
  )
);