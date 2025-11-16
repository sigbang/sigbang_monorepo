"use client";
import { useEffect } from 'react';

type Handler = (ev: KeyboardEvent) => void;

export function useHotkeys(handlers: Record<string, Handler>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const combo = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.altKey ? 'Alt+' : ''}${e.key}`;
      const h = handlers[combo] || handlers[e.key];
      if (h) {
        h(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}


