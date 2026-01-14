import { useTheme } from './ThemeContext';

/**
 * SailHub Icon Badge
 *
 * A decorative container for icons with brand-consistent styling.
 * Primary color is now mint (SailHub brand accent).
 */
export function IconBadge({
  icon,
  color = 'mint',
  size = 'md',
  className = '',
  variant = 'filled', // 'filled' | 'soft' | 'outline'
}) {
  const { isDark } = useTheme();

  const sizeStyles = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const iconSizeStyles = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const borderRadiusStyles = {
    xs: 'rounded-lg',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  };

  // Color variants - mint is now the primary/default
  const getColorStyles = () => {
    const colors = {
      // Primary mint (SailHub brand)
      mint: {
        filled: isDark
          ? 'bg-mint-400 text-navy-900 border-navy-900'
          : 'bg-mint-400 text-navy-900 border-navy-900',
        soft: isDark
          ? 'bg-mint-400/15 text-mint-400 border-mint-400/20'
          : 'bg-mint-100 text-mint-600 border-mint-500/20',
        outline: isDark
          ? 'bg-transparent text-mint-400 border-mint-400/40'
          : 'bg-transparent text-mint-600 border-mint-500/40',
      },
      // Legacy gold (backwards compatibility)
      gold: {
        filled: isDark
          ? 'bg-gold-400 text-navy-900 border-gold-500'
          : 'bg-gold-400 text-navy-900 border-gold-500',
        soft: isDark
          ? 'bg-gold-400/15 text-gold-400 border-gold-400/20'
          : 'bg-gold-200/50 text-gold-600 border-gold-400/30',
        outline: isDark
          ? 'bg-transparent text-gold-400 border-gold-400/40'
          : 'bg-transparent text-gold-600 border-gold-500/40',
      },
      // Navy/dark
      navy: {
        filled: isDark
          ? 'bg-navy-700 text-cream border-navy-600'
          : 'bg-navy-900 text-white border-navy-800',
        soft: isDark
          ? 'bg-navy-800/80 text-cream/80 border-navy-700'
          : 'bg-navy-100 text-navy-700 border-navy-200',
        outline: isDark
          ? 'bg-transparent text-cream/70 border-navy-600'
          : 'bg-transparent text-navy-700 border-navy-300',
      },
      // Status colors
      emerald: {
        filled: 'bg-emerald-500 text-white border-emerald-600',
        soft: isDark
          ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20'
          : 'bg-emerald-100 text-emerald-600 border-emerald-200',
        outline: isDark
          ? 'bg-transparent text-emerald-400 border-emerald-400/40'
          : 'bg-transparent text-emerald-600 border-emerald-400/40',
      },
      red: {
        filled: 'bg-red-500 text-white border-red-600',
        soft: isDark
          ? 'bg-red-400/15 text-red-400 border-red-400/20'
          : 'bg-red-100 text-red-600 border-red-200',
        outline: isDark
          ? 'bg-transparent text-red-400 border-red-400/40'
          : 'bg-transparent text-red-600 border-red-400/40',
      },
      amber: {
        filled: 'bg-amber-500 text-white border-amber-600',
        soft: isDark
          ? 'bg-amber-400/15 text-amber-400 border-amber-400/20'
          : 'bg-amber-100 text-amber-600 border-amber-200',
        outline: isDark
          ? 'bg-transparent text-amber-400 border-amber-400/40'
          : 'bg-transparent text-amber-600 border-amber-400/40',
      },
      cyan: {
        filled: 'bg-cyan-500 text-white border-cyan-600',
        soft: isDark
          ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/20'
          : 'bg-cyan-100 text-cyan-600 border-cyan-200',
        outline: isDark
          ? 'bg-transparent text-cyan-400 border-cyan-400/40'
          : 'bg-transparent text-cyan-600 border-cyan-400/40',
      },
      purple: {
        filled: 'bg-purple-500 text-white border-purple-600',
        soft: isDark
          ? 'bg-purple-400/15 text-purple-400 border-purple-400/20'
          : 'bg-purple-100 text-purple-600 border-purple-200',
        outline: isDark
          ? 'bg-transparent text-purple-400 border-purple-400/40'
          : 'bg-transparent text-purple-600 border-purple-400/40',
      },
      slate: {
        filled: isDark
          ? 'bg-slate-600 text-white border-slate-500'
          : 'bg-slate-600 text-white border-slate-500',
        soft: isDark
          ? 'bg-slate-400/15 text-slate-400 border-slate-400/20'
          : 'bg-slate-100 text-slate-600 border-slate-200',
        outline: isDark
          ? 'bg-transparent text-slate-400 border-slate-400/40'
          : 'bg-transparent text-slate-600 border-slate-400/40',
      },
    };

    const colorConfig = colors[color] || colors.mint;
    return colorConfig[variant] || colorConfig.soft;
  };

  return (
    <div
      className={`
        ${sizeStyles[size]}
        ${borderRadiusStyles[size]}
        border-2
        flex items-center justify-center
        transition-all duration-200
        ${getColorStyles()}
        ${className}
      `}
    >
      <span className={iconSizeStyles[size]}>{icon}</span>
    </div>
  );
}

export default IconBadge;
