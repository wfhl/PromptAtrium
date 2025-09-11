import * as React from "react"

// Toast types
type ToastProps = {
  variant?: "default" | "destructive";
}

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

// Simple toast implementation for standalone use
let toastCount = 0;
const listeners = new Set<(toast: ToasterToast) => void>();

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

function toast(options: Omit<ToasterToast, "id">) {
  const toastData = {
    id: genId(),
    ...options,
  };

  listeners.forEach((listener) => listener(toastData));
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    dismissToast(toastData.id);
  }, 3000);
}

function dismissToast(id: string) {
  // Implementation would be in toast component
}

export function useToast() {
  return { toast };
}

// For compatibility with existing UI components
export type { ToasterToast };