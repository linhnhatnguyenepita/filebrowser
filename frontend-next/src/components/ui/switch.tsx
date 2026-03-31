"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40",
        "bg-input data-checked:bg-primary data-checked:hover:bg-primary/80 data-unchecked:bg-input data-unchecked:hover:bg-input/80 dark:data-unchecked:bg-input/80 dark:data-unchecked:hover:bg-input",
        className
      )}
      {...props}
    />
  )
}

function SwitchThumb({ className, ...props }: SwitchPrimitive.Thumb.Props) {
  return (
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-md ring-0 transition-transform data-checked:translate-x-4 data-unchecked:translate-x-0",
        className
      )}
      {...props}
    />
  )
}

export { Switch, SwitchThumb }
