interface SegmentOption { value: string; label: string; }

interface PreferenceSegmentProps {
  label: string;
  description?: string;
  value: string;
  options: SegmentOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PreferenceSegment({ label, description, value, options, onChange, disabled }: PreferenceSegmentProps) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-none">{label}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex rounded-lg bg-muted p-0.5 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`flex-1 text-sm px-2 py-1 rounded-md transition-colors ${
              value === opt.value
                ? "bg-background text-foreground shadow-xs font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
