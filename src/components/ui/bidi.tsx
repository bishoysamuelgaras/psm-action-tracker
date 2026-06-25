import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function BidiText({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      dir="auto"
      className={cn("bidi-text", className)}
      {...props}
    />
  );
}

export function BidiBlock({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      dir="auto"
      className={cn("bidi-text", className)}
      {...props}
    />
  );
}

export function BidiCode({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      dir="ltr"
      className={cn("bidi-code-token", className)}
      {...props}
    />
  );
}
