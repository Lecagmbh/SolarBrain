// src/modules/ui/Button.tsx
import React from "react";

export type ButtonVariant = "primary" | "ghost" | "outline";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";
  const width = fullWidth ? "w-full" : "";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    outline:
      "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
  };

  return (
    <button
      className={`${base} ${width} ${variants[variant]} px-4 py-2 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
