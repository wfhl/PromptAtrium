import { useState, useEffect, createContext, useContext } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (toastId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: Omit<Toast, 'id'>) => {
    const id = String(toastCount++);
    const newToast = { ...props, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
  };

  const dismiss = (toastId?: string) => {
    setToasts((prev) =>
      toastId ? prev.filter((t) => t.id !== toastId) : []
    );
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Simple toast container component
function ToastContainer({ 
  toasts, 
  dismiss 
}: { 
  toasts: Toast[]; 
  dismiss: (id?: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            rounded-lg shadow-lg p-4 min-w-[300px]
            ${toast.variant === 'destructive' 
              ? 'bg-red-600 text-white' 
              : 'bg-white border border-gray-200 text-gray-900'
            }
          `}
        >
          {toast.title && (
            <div className="font-semibold text-sm">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm mt-1 opacity-90">{toast.description}</div>
          )}
          {toast.action && <div className="mt-2">{toast.action}</div>}
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}