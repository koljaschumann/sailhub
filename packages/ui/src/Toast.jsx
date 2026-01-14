import { createContext, useContext, useState, useCallback } from 'react';
import { useTheme } from './ThemeContext';
import { Icons } from './Icons';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
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

function ToastContainer({ toasts, removeToast }) {
  const { isDark } = useTheme();

  const typeStyles = {
    info: {
      icon: Icons.info,
      color: isDark ? 'text-sea-300' : 'text-teal-600',
      border: isDark ? 'border-sea-400/30' : 'border-teal-300'
    },
    success: {
      icon: Icons.check,
      color: 'text-success',
      border: isDark ? 'border-success/30' : 'border-green-300'
    },
    warning: {
      icon: Icons.alertTriangle,
      color: isDark ? 'text-gold-400' : 'text-amber-600',
      border: isDark ? 'border-gold-400/30' : 'border-amber-300'
    },
    error: {
      icon: Icons.x,
      color: 'text-coral',
      border: isDark ? 'border-coral/30' : 'border-red-300'
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => {
        const style = typeStyles[toast.type] || typeStyles.info;
        return (
          <div
            key={toast.id}
            className={`
              toast-enter
              flex items-center gap-3 px-4 py-3
              rounded-xl border
              ${isDark ? 'bg-navy-800' : 'bg-white'}
              ${style.border}
              shadow-lg
              min-w-[300px] max-w-[400px]
            `}
          >
            <span className={`w-5 h-5 flex-shrink-0 ${style.color}`}>
              {style.icon}
            </span>
            <p className={`flex-1 text-sm ${isDark ? 'text-cream' : 'text-light-text'}`}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`
                w-6 h-6 rounded-lg flex items-center justify-center
                ${isDark ? 'text-cream/40 hover:text-cream' : 'text-light-muted hover:text-light-text'}
              `}
            >
              <span className="w-4 h-4">{Icons.x}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastProvider;
