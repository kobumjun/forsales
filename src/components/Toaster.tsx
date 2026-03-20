"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string };

export function showToast(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("toast", { detail: message }));
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message: e.detail }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2500);
    };
    window.addEventListener("toast", handler as EventListener);
    return () => window.removeEventListener("toast", handler as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[9999]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
