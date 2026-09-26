"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}

/** Label + control + hint/error wrapper used across every form. */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
  htmlFor,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-[0.8rem] font-semibold text-white/75"
        >
          {label}
          {required && <span className="text-[#F42A41]">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-300">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-white/40">{hint}</p>
      )}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { invalid = false, leftIcon, rightSlot, className, id, ...rest },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-full rounded-2xl border bg-white/[0.04] px-4 text-sm text-white",
            "placeholder:text-white/30 transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-[#FFC107]/60 focus:ring-offset-0",
            leftIcon ? "pl-10" : undefined,
            rightSlot ? "pr-10" : undefined,
            invalid
              ? "border-[#F42A41]/60 focus:ring-[#F42A41]/60"
              : "border-white/12 focus:border-[#FFC107]/50",
            className,
          )}
          {...rest}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
    );
  },
);

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ invalid = false, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full resize-none rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white",
          "placeholder:text-white/30 transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[#FFC107]/60",
          invalid
            ? "border-[#F42A41]/60 focus:ring-[#F42A41]/60"
            : "border-white/12 focus:border-[#FFC107]/50",
          className,
        )}
        {...rest}
      />
    );
  },
);

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, options, className, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full appearance-none rounded-2xl border bg-white/[0.04] px-4 text-sm text-white",
        "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FFC107]/60",
        invalid
          ? "border-[#F42A41]/60 focus:ring-[#F42A41]/60"
          : "border-white/12 focus:border-[#FFC107]/50",
        className,
      )}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#161d29] text-white">
          {option.label}
        </option>
      ))}
    </select>
  );
});
