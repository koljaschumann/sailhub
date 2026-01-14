import { useTheme } from '@tsc/ui';

export default function PoweredByAitema() {
  const { isDark } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <a
        href="https://aitema.de"
        target="_blank"
        rel="noopener noreferrer"
        className={`
          group flex items-center gap-2 px-3 py-1.5 rounded-full
          backdrop-blur-sm transition-all duration-300
          hover:scale-105
          ${isDark
            ? 'bg-navy-800/60 hover:bg-navy-700/80 border border-navy-600/50'
            : 'bg-white/60 hover:bg-white/90 border border-light-border/50 shadow-sm'
          }
        `}
      >
        {/* Shimmer Icon */}
        <div className="relative w-4 h-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`w-4 h-4 ${isDark ? 'text-gold-400' : 'text-teal-500'}`}
          >
            {/* Sparkle/AI Icon */}
            <path
              d="M12 2L13.09 8.26L19 7L14.74 11.27L21 12L14.74 12.73L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.73L3 12L9.26 11.27L5 7L10.91 8.26L12 2Z"
              fill="currentColor"
              className="animate-pulse"
            />
          </svg>
          {/* Shimmer overlay */}
          <div
            className={`
              absolute inset-0 rounded-full opacity-0 group-hover:opacity-100
              transition-opacity duration-300
              ${isDark ? 'bg-gold-400/30' : 'bg-teal-400/30'}
            `}
            style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
        </div>

        {/* Text */}
        <span className={`
          text-xs font-medium tracking-wide
          ${isDark ? 'text-cream/60 group-hover:text-cream/90' : 'text-light-muted group-hover:text-light-text'}
          transition-colors duration-300
        `}>
          powered by{' '}
          <span className={`
            font-semibold text-shimmer
            ${isDark ? 'text-gold-400' : 'text-teal-600'}
          `}>
            aitema
          </span>
        </span>
      </a>
    </div>
  );
}
