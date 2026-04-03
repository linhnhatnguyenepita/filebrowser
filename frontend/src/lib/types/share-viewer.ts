// frontend/src/lib/types/share-viewer.ts

export interface ShareSidebarLink {
  name: string;
  category: string;
  target: string;
  icon: string;
  sourceName?: string;
}

export interface ShareInfo {
  downloadsLimit: number;
  shareTheme: string;
  disableAnonymous: boolean;
  maxBandwidth: number;
  disableThumbnails: boolean;
  keepAfterExpiration: boolean;
  allowedUsernames: string[];
  themeColor: string;
  banner: string;
  title: string;
  description: string;
  favicon: string;
  quickDownload: boolean;
  hideNavButtons: boolean;
  disableSidebar: boolean;
  source: string;
  path: string;
  downloadURL: string;
  shareURL: string;
  faviconUrl: string;
  bannerUrl: string;
  disableShareCard: boolean;
  enforceDarkLightMode: "dark" | "light" | "";
  viewMode: "list" | "compact" | "normal" | "gallery";
  enableOnlyOffice: boolean;
  shareType: string;
  perUserDownloadLimit: boolean;
  extractEmbeddedSubtitles: boolean;
  allowDelete: boolean;
  allowCreate: boolean;
  allowModify: boolean;
  disableFileViewer: boolean;
  disableDownload: boolean;
  allowReplacements: boolean;
  sidebarLinks: ShareSidebarLink[];
  hasPassword: boolean;
  showHidden: boolean;
  disableLoginOption: boolean;
  sourceURL: string;
  canEditShare: boolean;
}
