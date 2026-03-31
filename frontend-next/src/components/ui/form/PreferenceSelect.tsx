import * as React from "react"
import { Select as SelectPrimitive, SelectTrigger as SelectTriggerPrimitive, SelectValue, SelectContent, SelectItem } from "@base-ui/react/select"

import { cn } from "@/lib/utils"

export { SelectValue, SelectContent, SelectItem }

interface SelectOption { value: string; label: string; }

interface PreferenceSelectProps {
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PreferenceSelect({ label, description, value, options, onChange, onValueChange, placeholder, disabled }: PreferenceSelectProps) {
  const handleValueChange = (val: string) => {
    onChange?.(val);
    onValueChange?.(val);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-medium text-foreground leading-none">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <SelectPrimitive value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTriggerPrimitive className={cn("w-28 h-7 text-xs [&>span]:line-clamp-1")}>
          <SelectValue placeholder={placeholder} />
        </SelectTriggerPrimitive>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPrimitive>
    </div>
  );
}
