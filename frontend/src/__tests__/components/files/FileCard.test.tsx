import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FileCard from "frontend-next/src/components/files/FileCard";

describe("FileCard — folder count", () => {
  it("shows '{n} items' for a folder with children", () => {
    const folder = {
      name: "Documents",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/Documents",
      count: 5,
    };
    render(<FileCard item={folder} selected={false} onNavigate={() => {}} />);
    expect(screen.getByText("5 items")).toBeInTheDocument();
  });

  it("shows '1 item' for a folder with a single child", () => {
    const folder = {
      name: "temp",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/temp",
      count: 1,
    };
    render(<FileCard item={folder} selected={false} onNavigate={() => {}} />);
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });

  it("shows '0 item' for an empty folder", () => {
    const folder = {
      name: "empty",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/empty",
      count: 0,
    };
    render(<FileCard item={folder} selected={false} onNavigate={() => {}} />);
    expect(screen.getByText("0 item")).toBeInTheDocument();
  });

  it("shows nothing for a folder when count is missing", () => {
    const folder = {
      name: "empty",
      size: 0,
      modified: "2026-04-01T00:00:00Z",
      type: "directory",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/empty",
    };
    render(<FileCard item={folder} selected={false} onNavigate={() => {}} />);
    expect(screen.queryByText(/items?/)).not.toBeInTheDocument();
  });

  it("still shows formatted size for files", () => {
    const file = {
      name: "notes.pdf",
      size: 4 * 1024,
      modified: "2026-04-01T00:00:00Z",
      type: "application/pdf",
      hidden: false,
      hasPreview: false,
      isShared: false,
      path: "/notes.pdf",
    };
    render(<FileCard item={file} selected={false} onNavigate={() => {}} />);
    expect(screen.getByText("4 KB")).toBeInTheDocument();
  });
});
