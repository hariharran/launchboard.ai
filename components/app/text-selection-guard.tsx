"use client";

import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, [contenteditable='true'], [data-allow-drag='true']"));
}

export function TextSelectionGuard() {
  useEffect(() => {
    const handleDragStart = (event: DragEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const selection = window.getSelection();
      const hasSelectedText = Boolean(selection && !selection.isCollapsed && selection.toString().trim().length > 0);

      if (hasSelectedText) {
        event.preventDefault();
      }
    };

    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
}
