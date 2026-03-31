import { Input } from "@/components/ui/input";

interface PreferenceInputProps {
  label: string;
  description?: string;
  type?: "text" | "number";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function PreferenceInput({ label, description, type = "text", value, onChange, placeholder, min, max, disabled }: PreferenceInputProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-medium text-foreground leading-none">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        className="w-24 h-7 text-xs"
      />
    </div>
  );
}
