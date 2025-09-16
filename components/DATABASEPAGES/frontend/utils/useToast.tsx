import React, { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36);
      const newToast = { ...toast, id };
      
      setToasts((prev) => [...prev, newToast]);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              max-w-sm p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg
              ${t.variant === "destructive" ? "border-red-500" : "border-gray-200"}
              border dark:border-gray-700
            `}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};