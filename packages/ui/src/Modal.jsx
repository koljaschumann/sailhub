import { useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { Icons } from './Icons';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) {
  const { isDark } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const bgStyles = isDark
    ? 'bg-gradient-to-br from-navy-800 to-navy-900 border-gold-400/20'
    : 'bg-white border-light-border';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizeStyles[size]}
          rounded-2xl border p-6
          max-h-[85vh] overflow-y-auto
          ${bgStyles}
          shadow-2xl
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h2 className={`text-xl font-semibold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  transition-colors
                  ${isDark
                    ? 'text-cream/60 hover:text-cream hover:bg-navy-700'
                    : 'text-light-muted hover:text-light-text hover:bg-light-border'}
                `}
              >
                <span className="w-5 h-5">{Icons.x}</span>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

export default Modal;
