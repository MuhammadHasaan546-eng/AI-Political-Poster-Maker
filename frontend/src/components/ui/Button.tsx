"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "gold"
  | "outline"
  | "ghost"
  | "danger"
  | "subtle";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-gradient text-white shadow-lg shadow-[#006A4E]/40 hover:shadow-[#006A4E]/60 border border-white/10",
  gold: "bg-gold-gradient text-[#0D1117] font-bold shadow-lg shadow-[#FFC107]/30 hover:shadow-[#FFC107]/50 border border-[#FFC107]/40",
  outline:
    "border border-white/15 bg-white/[0.03] text-white hover:border-[#FFC107]/60 hover:bg-white/[0.06]",
  ghost: "text-white/75 hover:bg-white/[0.06] hover:text-white",
  danger:
    "bg-red-gradient text-white shadow-lg shadow-[#F42A41]/35 hover:shadow-[#F42A41]/55 border border-white/10",
  subtle: "bg-white/[0.06] text-white/85 hover:bg-white/[0.1] border border-white/5",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[0.8rem] gap-1.5 rounded-xl",
  md: "h-11 px-5 text-sm gap-2 rounded-2xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-2xl",
  icon: "size-10 rounded-xl",
};

/**
 * Props extend Motion's button props so `register()`/`onClick`/`aria-*`
 * all flow through without React-vs-Motion event signature clashes.
 */
export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

/**
 * Primary action control. Renders a real <button> so it composes with
 * react-hook-form's register()/handleSubmit without extra wiring.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = Boolean(disabled) || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileHover={isDisabled ? undefined : { y: -2 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "relative inline-flex select-none items-center justify-center font-semibold tracking-tight",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#FFC107]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1117]",
        "disabled:cursor-not-allowed disabled:opacity-55",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Spinner className="size-4" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  );
});
