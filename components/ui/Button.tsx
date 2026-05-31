import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { sfx } from '../../lib/sfx';

/**
 * Chunky PIXEL-RETRO arcade button.
 *
 * Renders the `.arcade-btn` class from index.css (hard offset shadow, neon glow,
 * :active press, :disabled grey-out) paired with `.font-pixel` for the label.
 * Fires sfx.select() on every (enabled) click before delegating to onClick.
 *
 * The public API (variant / size / glow / className / ...button props) is kept
 * 1:1 with the previous implementation so existing callers — ProfileScreen,
 * RaiseScreen, VerdictScreen — render unchanged.
 *
 * Variant mapping onto the arcade palette:
 *   primary  -> solid accent fill (--accent, recolors per mode wrapper)
 *   danger   -> solid red fill (KO / destructive)
 *   outline  -> neon-outline ghost (.arcade-btn--ghost)
 *   ghost    -> neon-outline ghost, slightly quieter
 */
type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  /** Decorative pulse on the hard shadow/glow (e.g. the primary CTA). */
  glow?: boolean;
  children: React.ReactNode;
}

const base = 'arcade-btn font-pixel inline-flex items-center justify-center gap-2 text-center';

const sizes: Record<Size, string> = {
  sm: 'text-[9px] px-3 py-2 leading-relaxed',
  md: 'text-[11px] px-5 py-3 leading-relaxed',
  lg: 'text-[13px] px-6 py-4 leading-relaxed',
};

const variants: Record<Variant, string> = {
  // solid accent fill — recolors with the mode wrapper's --accent
  primary: '',
  // solid red — danger / KO actions; override --accent locally
  danger: 'accent-expert',
  // transparent body + neon outline
  outline: 'arcade-btn--ghost',
  ghost: 'arcade-btn--ghost',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = false,
  className = '',
  children,
  onClick,
  disabled,
  ...props
}) => {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return;
    sfx.select();
    onClick?.(e);
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { y: 2 }}
      transition={{ type: 'spring', stiffness: 600, damping: 26 }}
      disabled={disabled}
      onClick={handleClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        glow ? 'animate-glow-pulse' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
