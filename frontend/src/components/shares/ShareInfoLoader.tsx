import { useEffect, useState, type ReactNode } from "react";
import type { ShareInfo } from "@/lib/types/share-viewer";
import { getShareInfo } from "@/lib/api/share-viewer";
import ShareError from "./ShareError";

interface Props {
  hash: string;
  children: (info: ShareInfo) => ReactNode;
}

export default function ShareInfoLoader({ hash, children }: Props) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getShareInfo(hash);
        if (cancelled) return;
        setInfo(data);
        applyTheme(data);
      } catch (err: unknown) {
        if (cancelled) return;
        if (
          err &&
          typeof err === "object" &&
          "status" in err
        ) {
          setError(err as { status: number; message: string });
        } else {
          setError({ status: 0, message: "Could not load share. Please check your connection." });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [hash]);

  if (error) {
    if (error.status === 404) {
      return <ShareError title="Share not found" description="This share link does not exist or has been removed." action={{ label: "Go to FileBrowser", href: "/" }} />;
    }
    if (error.status === 403) {
      return <ShareError title="Share expired" description="This share link has expired." />;
    }
    return <ShareError title="Could not load share" description={error.message} />;
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children(info)}</>;
}

function applyTheme(info: ShareInfo) {
  // Apply dark/light mode enforcement
  if (info.enforceDarkLightMode === "dark") {
    document.documentElement.classList.add("dark");
  } else if (info.enforceDarkLightMode === "light") {
    document.documentElement.classList.remove("dark");
  }

  // Apply custom theme CSS variables if shareTheme is set
  if (info.shareTheme) {
    // Load theme from existing themes config — append to document head if not already present
    const themeId = `share-theme-${info.shareTheme}`;
    if (!document.getElementById(themeId)) {
      const link = document.createElement("link");
      link.id = themeId;
      link.rel = "stylesheet";
      link.href = `/api/themes/${info.shareTheme}`;
      document.head.appendChild(link);
    }
  }

  // Apply favicon
  if (info.faviconUrl) {
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = info.faviconUrl;
  }
}
