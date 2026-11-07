import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-wine text-white hover:bg-wine-deep shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
  secondary: "bg-paper text-ink border border-line hover:border-line-strong hover:bg-ivory",
  ghost: "text-ink-soft hover:bg-ivory-deep hover:text-ink",
  danger: "bg-[#8f1d1d] text-white hover:bg-[#741616]",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[13px] gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, className = "", children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  className = "",
  children,
  tone = "default",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors ${
        tone === "danger" ? "hover:bg-[#fbeaea] hover:text-[#8f1d1d]" : "hover:bg-ivory-deep hover:text-ink"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
