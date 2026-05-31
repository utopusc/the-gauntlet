import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  glow?: boolean;
  children: React.ReactNode;
}

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'tracking-tight transition-colors duration-200 select-none ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const variants: Record<Variant, string> = {
  primary:
    'text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-violet-400 ' +
    'hover:from-cyan-300 hover:to-violet-300 shadow-[0_0_30px_-6px_rgba(34,211,238,0.7)]',
  outline:
    'text-cyan-100 border border-cyan-400/40 bg-cyan-400/5 hover:bg-cyan-400/15 ' +
    'hover:border-cyan-300/70',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  danger:
    'text-white bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 ' +
    'hover:to-amber-400 shadow-[0_0_30px_-6px_rgba(244,63,94,0.6)]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
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
