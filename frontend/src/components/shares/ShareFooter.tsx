import { ExternalLink } from "lucide-react";

interface Props {
  sourceURL: string;
}

export default function ShareFooter({ sourceURL }: Props) {
  const originLabel = (() => {
    try {
      const u = new URL(sourceURL);
      return u.hostname;
    } catch {
      return "FileBrowser";
    }
  })();

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 text-center">
      <p className="text-xs text-muted-foreground">
        Shared via{" "}
        <a
          href={sourceURL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors underline underline-offset-2"
        >
          {originLabel}
          <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
}
