import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_14px_30px_hsl(var(--primary)/0.24)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_18px_40px_hsl(var(--primary)/0.34)] active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_12px_24px_hsl(var(--destructive)/0.22)] hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-[0_16px_32px_hsl(var(--destructive)/0.3)] active:translate-y-0",
        outline:
          "border border-input bg-background/75 text-foreground hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_12px_28px_hsl(var(--shadow)/0.24)] active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/88 hover:shadow-[0_12px_28px_hsl(var(--shadow)/0.22)] active:translate-y-0",
        ghost:
          "text-foreground hover:bg-accent/80 hover:text-accent-foreground hover:shadow-[0_10px_24px_hsl(var(--shadow)/0.18)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-10 px-3.5 text-[13px]",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
