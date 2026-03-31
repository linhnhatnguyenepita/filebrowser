interface PreferenceSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function PreferenceSection({ title, description, children }: PreferenceSectionProps) {
  return (
    <div className="space-y-1">
      <div className="pt-3 first:pt-0">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-0">{children}</div>
    </div>
  );
}
