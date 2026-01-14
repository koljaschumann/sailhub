import { useTheme } from './ThemeContext';

/**
 * SailHub Button Component
 *
 * Matches the SailHub brand identity with:
 * - Mint green as primary accent
 * - Rounded pill shapes
 * - Dark borders (SailHub signature)
 */
export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon = null,
  iconPosition = 'left',
  type = 'button',
  fullWidth = false,
}) {
  const { isDark } = useTheme();

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  // SailHub brand button variants
  const variantStyles = {
    // Primary - Mint green with dark text (SailHub signature)
    primary: isDark
      ? 'bg-mint-400 text-navy-900 hover:bg-mint-300 border-2 border-navy-900 shadow-md hover:shadow-lg'
      : 'bg-mint-400 text-navy-900 hover:bg-mint-300 border-2 border-navy-900 shadow-md hover:shadow-lg',

    // Secondary - Outlined with mint accent
    secondary: isDark
      ? 'bg-navy-800 text-mint-400 hover:bg-navy-700 border-2 border-mint-400/30 hover:border-mint-400/50'
      : 'bg-white text-navy-900 hover:bg-sage border-2 border-navy-900/20 hover:border-navy-900/40',

    // Ghost - Minimal, text only
    ghost: isDark
      ? 'text-cream/70 hover:text-mint-400 hover:bg-mint-400/10'
      : 'text-light-text/70 hover:text-mint-600 hover:bg-mint-100/50',

    // Danger - For destructive actions
    danger: isDark
      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-2 border-red-500/30'
      : 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200',

    // Outline - Simple border style
    outline: isDark
      ? 'bg-transparent text-cream border-2 border-cream/30 hover:border-mint-400 hover:text-mint-400'
      : 'bg-transparent text-navy-900 border-2 border-navy-900/30 hover:border-mint-500 hover:text-mint-600',

    // Mint - Soft mint background
    mint: isDark
      ? 'bg-mint-400/15 text-mint-400 hover:bg-mint-400/25 border border-mint-400/20'
      : 'bg-mint-100 text-mint-600 hover:bg-mint-200 border border-mint-500/20',

    // White - Clean white button (for dark backgrounds)
    white: 'bg-white text-navy-900 hover:bg-cream border-2 border-navy-900 shadow-md hover:shadow-lg',

    // Dark - Navy button (for light backgrounds)
    dark: 'bg-navy-900 text-white hover:bg-navy-800 border-2 border-navy-900 shadow-md hover:shadow-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-full font-semibold transition-all duration-200
        flex items-center justify-center
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {icon && iconPosition === 'left' && (
        <span className={iconSizes[size]}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className={iconSizes[size]}>{icon}</span>
      )}
    </button>
  );
}

/**
 * SailHub Icon Button - Circular button with just an icon
 */
export function IconButton({
  icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className = '',
  label,
  type = 'button',
}) {
  const { isDark } = useTheme();

  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantStyles = {
    ghost: isDark
      ? 'text-cream/60 hover:text-mint-400 hover:bg-mint-400/10'
      : 'text-light-muted hover:text-mint-600 hover:bg-mint-100',
    filled: isDark
      ? 'bg-mint-400/15 text-mint-400 hover:bg-mint-400/25'
      : 'bg-mint-100 text-mint-600 hover:bg-mint-200',
    outline: isDark
      ? 'border border-mint-400/30 text-mint-400 hover:bg-mint-400/10'
      : 'border border-mint-500/30 text-mint-600 hover:bg-mint-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`
        rounded-full transition-all duration-200
        flex items-center justify-center
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
        ${className}
      `}
    >
      <span className={iconSizes[size]}>{icon}</span>
    </button>
  );
}

export default Button;
