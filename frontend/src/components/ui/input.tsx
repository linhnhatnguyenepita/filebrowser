import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "bg-secondary border-0 text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  )
}

export { Input }
