import { forwardRef } from "react";
import { Handle, HandleProps } from "@xyflow/react";

import { cn } from "@/lib/utils";

export type BaseHandleProps = HandleProps;

export const BaseHandle = forwardRef<HTMLDivElement, BaseHandleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Handle
        ref={ref}
        {...props}
        className={cn(
          "h-[11px] w-[11px] rounded-full border border-neutral-200 border-slate-300 bg-slate-100 transition dark:border-neutral-100 dark:bg-neutral-100 dark:border-neutral-800 dark:dark:border-neutral-800 dark:dark:bg-neutral-800",
          className,
        )}
        {...props}
      >
        {children}
      </Handle>
    );
  },
);

BaseHandle.displayName = "BaseHandle";
