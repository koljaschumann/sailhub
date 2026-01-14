import { useTheme } from './ThemeContext';
import Icons from './Icons';

/**
 * Dezenter Spenden-Button für Dashboard und Module
 * Positioniert sich unten rechts, über dem FeedbackWidget
 */
export function DonateButton({ onClick }) {
  const { isDark } = useTheme();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Fallback: Navigiere zum Spendenportal
      window.location.href = '/spendenportal';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 left-[4.5rem] z-40 h-10 flex items-center gap-2 px-4 rounded-full shadow-md transition-all hover:scale-105 ${
        isDark
          ? 'bg-navy-800/90 hover:bg-navy-700 text-cream/70 hover:text-cream border border-rose-400/20 hover:border-rose-400/40'
          : 'bg-white/90 hover:bg-white text-light-muted hover:text-rose-500 border border-rose-200 hover:border-rose-300'
      }`}
      title="TSC-Jugend unterstützen"
    >
      <span className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>
        {Icons.heart}
      </span>
      <span className="text-sm font-medium">Spenden</span>
    </button>
  );
}

export default DonateButton;
