import React from "react";
import clsx from "clsx";

type StatusBadgeProps = {
  label: string;
  variant?: "critical" | "soon" | "plan" | "info" | "default";
};

const variants: Record<
  NonNullable<StatusBadgeProps["variant"]>,
  string
> = {
  critical:
    "bg-[rgba(255,95,64,0.12)] text-[#ff5f40] border border-[#ff5f40]/40 shadow-[0_0_8px_rgba(255,95,64,0.45)]",
  soon:
    "bg-[rgba(245,166,35,0.12)] text-[#f5a623] border border-[#f5a623]/40 shadow-[0_0_8px_rgba(245,166,35,0.45)]",
  plan:
    "bg-[rgba(40,255,184,0.12)] text-[#28ffb8] border border-[#28ffb8]/40 shadow-[0_0_8px_rgba(40,255,184,0.45)]",
  info:
    "bg-[rgba(0,183,255,0.12)] text-[#00b7ff] border border-[#00b7ff]/40 shadow-[0_0_8px_rgba(0,183,255,0.45)]",
  default:
    "bg-[rgba(139,155,183,0.10)] text-[#8b9bb7] border border-[#8b9bb7]/30 shadow-none",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = "default",
}) => {
  return (
    <span
      className={clsx(
        "px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap transition-all",
        variants[variant]
      )}
    >
      {label}
    </span>
  );
};
