import * as React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-lg shadow-stone-200/50 dark:shadow-stone-950/40",
      secondary: "bg-white text-stone-900 border border-stone-200 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700 dark:hover:bg-stone-700 shadow-sm",
      ghost: "text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-800/70",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-8 text-base",
      lg: "h-14 px-10 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
