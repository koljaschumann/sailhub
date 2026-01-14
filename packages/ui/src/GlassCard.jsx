import { useTheme } from './ThemeContext';

/**
 * SailHub Card Component
 *
 * A versatile card component matching the SailHub brand identity:
 * - Light mode: White background with dark border
 * - Dark mode: Glassmorphic navy with mint accents
 * - Rounded corners (1.5rem)
 * - Subtle shadows and hover effects
 */
export function GlassCard({
  children,
  className = '',
  onClick,
  shimmer = false,
  glow = false,
  hoverLift = false,
  gradientBorder = false,
  animate = false,
  featured = false,
  variant = 'default', // 'default' | 'elevated' | 'outlined' | 'mint'
  padding = 'default', // 'default' | 'compact' | 'large' | 'none'
}) {
  const { isDark } = useTheme();

  // Padding variants
  const paddingStyles = {
    default: 'p-6',
    compact: 'p-4',
    large: 'p-8',
    none: 'p-0',
  };

  // Card variant styles
  const getVariantStyles = () => {
    if (featured) {
      return 'bg-gradient-to-br from-mint-400 to-mint-500 border-2 border-navy-900 text-navy-900';
    }

    switch (variant) {
      case 'elevated':
        return isDark
          ? 'bg-navy-800/90 border-mint-400/20 shadow-lg shadow-mint-400/5'
          : 'bg-white border-2 border-light-text/10 shadow-lg';

      case 'outlined':
        return isDark
          ? 'bg-transparent border-2 border-mint-400/30 hover:border-mint-400/50'
          : 'bg-transparent border-2 border-light-text/20 hover:border-mint-500/50';

      case 'mint':
        return isDark
          ? 'bg-mint-400/10 border-mint-400/30'
          : 'bg-mint-100 border-mint-500/30';

      default:
        return isDark
          ? 'bg-gradient-to-br from-navy-800/80 to-navy-850/95 border-mint-400/15 backdrop-blur-xl'
          : 'bg-white border-2 border-light-text/10';
    }
  };

  // Shadow styles based on mode and variant
  const getShadowStyles = () => {
    if (featured) return 'shadow-sailhub';

    return isDark
      ? 'shadow-[0_4px_24px_rgba(0,0,0,0.35)]'
      : 'shadow-sailhub';
  };

  // Hover styles
  const getHoverStyles = () => {
    if (!onClick && !hoverLift) return '';

    return isDark
      ? 'hover:border-mint-400/30 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(0,230,118,0.08)]'
      : 'hover:shadow-sailhub-hover hover:border-mint-500/20';
  };

  return (
    <div
      className={`
        rounded-3xl border transition-all duration-300
        ${paddingStyles[padding]}
        ${getVariantStyles()}
        ${getShadowStyles()}
        ${getHoverStyles()}
        ${shimmer ? 'shimmer' : ''}
        ${glow ? 'glow-pulse' : ''}
        ${hoverLift ? 'hover-lift' : ''}
        ${gradientBorder ? 'gradient-border' : ''}
        ${animate ? 'fade-slide-in' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * SailHub Feature Card - for highlighting key features
 * Includes icon, title, description, and optional badge
 */
export function FeatureCard({
  icon,
  title,
  description,
  badge,
  className = '',
  onClick,
}) {
  const { isDark } = useTheme();

  return (
    <GlassCard
      className={`group ${className}`}
      onClick={onClick}
      hoverLift
    >
      {/* Icon Container */}
      <div className={`
        w-14 h-14 rounded-2xl flex items-center justify-center mb-4
        transition-transform duration-300 group-hover:scale-110
        ${isDark
          ? 'bg-mint-400/15 text-mint-400'
          : 'bg-mint-100 text-mint-500'
        }
      `}>
        <span className="w-7 h-7">{icon}</span>
      </div>

      {/* Badge (optional) */}
      {badge && (
        <span className={`
          inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3
          ${isDark
            ? 'bg-mint-400/20 text-mint-400'
            : 'bg-mint-100 text-mint-600'
          }
        `}>
          {badge}
        </span>
      )}

      {/* Title */}
      <h3 className={`
        text-lg font-semibold mb-2
        ${isDark ? 'text-cream' : 'text-light-text'}
      `}>
        {title}
      </h3>

      {/* Description */}
      <p className={`
        text-sm
        ${isDark ? 'text-cream/60' : 'text-light-muted'}
      `}>
        {description}
      </p>
    </GlassCard>
  );
}

/**
 * SailHub Stats Card - for displaying key metrics
 */
export function StatsCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  className = '',
}) {
  const { isDark } = useTheme();
  const isPositiveTrend = trend && trend > 0;

  return (
    <GlassCard className={className}>
      <div className="flex items-start justify-between">
        <div>
          {/* Label */}
          <p className={`text-sm mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            {label}
          </p>

          {/* Value */}
          <p className={`text-3xl font-bold ${isDark ? 'text-mint-400' : 'text-mint-500'}`}>
            {value}
          </p>

          {/* Trend (optional) */}
          {trend !== undefined && (
            <p className={`
              text-sm mt-1 flex items-center gap-1
              ${isPositiveTrend ? 'text-mint-400' : 'text-coral'}
            `}>
              <span>{isPositiveTrend ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
              {trendLabel && (
                <span className={isDark ? 'text-cream/50' : 'text-light-muted'}>
                  {trendLabel}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${isDark ? 'bg-mint-400/10 text-mint-400' : 'bg-mint-100 text-mint-500'}
          `}>
            <span className="w-6 h-6">{icon}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default GlassCard;
