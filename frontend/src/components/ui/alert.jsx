import * as React from "react";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border-2 p-5 shadow-md transition-all duration-200 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border/50",
        destructive:
          "border-destructive/50 bg-destructive/5 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-primary/50 bg-primary/5 text-primary [&>svg]:text-primary",
        warning:
          "border-accent/50 bg-accent/5 text-accent [&>svg]:text-accent",
        info:
          "border-primary/30 bg-primary/5 text-primary [&>svg]:text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef(
  (
    {
      className,
      variant,
      autoDismiss = false,
      showCloseButton = false,
      onDismiss,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleDismiss = React.useCallback(() => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss();
      }
    }, [onDismiss]);

    React.useEffect(() => {
      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, 3000); // 3 seconds

        return () => clearTimeout(timer);
      }
    }, [autoDismiss, handleDismiss]);

    if (!isVisible) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}>
        {showCloseButton && (
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close alert">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
