import { useEffect } from "react";

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  handler: ShortcutHandler;
  /** If true, fires even when focus is in an input/textarea */
  allowInInput?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (e.key === shortcut.key) {
          if (isInput && !shortcut.allowInInput) continue;
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
