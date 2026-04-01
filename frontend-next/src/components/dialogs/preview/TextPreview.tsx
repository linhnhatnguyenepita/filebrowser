import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FileInfo } from "@/lib/api/resources";
import { getDownloadURL } from "@/lib/api/resources";

interface TextPreviewProps {
  file: FileInfo;
}

const MAX_TEXT_SIZE = 1024 * 1024; // 1MB

export default function TextPreview({ file }: TextPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent(null);
    setTruncated(false);

    if (file.size > MAX_TEXT_SIZE) {
      setError("File is too large to preview. Please download it.");
      setLoading(false);
      return;
    }

    const url = getDownloadURL(file.source ?? "default", file.path);

    fetch(url, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        if (text.length > MAX_TEXT_SIZE) {
          setContent(text.slice(0, MAX_TEXT_SIZE));
          setTruncated(true);
        } else {
          setContent(text);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load text");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-destructive">
        <span>{error}</span>
        <a
          href={getDownloadURL(file.source ?? "default", file.path)}
          download={file.name}
          className="text-sm text-primary hover:underline"
        >
          Download instead
        </a>
      </div>
    );
  }

  const lines = (content ?? "").split("\n");

  return (
    <div className="flex flex-col rounded-xl overflow-hidden max-h-[80vh]">
      {truncated && (
        <div className="px-3 py-1.5 bg-amber-500/10 text-amber-500 text-sm border-b border-amber-500/20">
          File truncated at 1MB.{" "}
          <a
            href={getDownloadURL(file.source ?? "default", file.path)}
            download={file.name}
            className="underline hover:opacity-80"
          >
            Download
          </a>{" "}
          for full content.
        </div>
      )}
      <div className="flex overflow-auto bg-secondary/50 font-mono text-sm leading-6">
        {/* Line numbers */}
        <div className="flex-shrink-0 select-none text-right pr-3 pl-3 py-3 text-muted-foreground/60 border-r border-border/50 min-w-[3rem]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Content */}
        <pre className="flex-1 px-3 py-3 whitespace-pre overflow-x-auto text-foreground">
          {content}
        </pre>
      </div>
    </div>
  );
}
