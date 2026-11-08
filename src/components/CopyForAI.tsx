"use client";

import { useState } from "react";

/** Copies the whole cloud, as one plain-text document, for pasting into an AI chat. */
export function CopyForAI({ text, className = "" }: { text: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`shrink-0 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors ${className}`}
      aria-live="polite"
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed: use the text link" : "Copy for AI"}
    </button>
  );
}
