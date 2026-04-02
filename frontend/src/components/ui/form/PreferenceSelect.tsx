import * as React from "react"
import { cn } from "@/lib/utils"

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
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange?.(val);
    onValueChange?.(val);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-foreground leading-none">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "h-7 text-sm rounded-lg border border-input bg-background px-1.5 pr-6 appearance-none cursor-pointer",
          "focus:outline-none focus:ring-1 focus:ring-ring"
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
