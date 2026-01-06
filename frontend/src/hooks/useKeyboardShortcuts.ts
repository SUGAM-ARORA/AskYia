// frontend/src/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback, useState } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: Shortcut[];
}

export const useKeyboardShortcuts = ({ 
  enabled = true, 
  shortcuts 
}: UseKeyboardShortcutsOptions) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape key in inputs
        if (event.key !== "Escape") return;
      }

      // Toggle help modal with ?
      if (event.key === "?" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!shortcut.shift === event.shiftKey;
        const altMatch = !!shortcut.alt === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    isHelpOpen,
    setIsHelpOpen,
    shortcuts,
  };
};

// Format shortcut for display
export const formatShortcut = (shortcut: Shortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.meta) parts.push("⌘");
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(" + ");
};

// Group shortcuts by category
export const groupShortcutsByCategory = (shortcuts: Shortcut[]) => {
  return shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);
};