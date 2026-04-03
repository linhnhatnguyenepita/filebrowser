// frontend/src/lib/api/share-viewer.test.ts
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getShareInfo, getShareItems, getShareDownloadURL } from "./share-viewer";

beforeEach(() => {
  vi.restoreAllMocks();
  window.globalVars = { baseURL: "https://example.com/" };
});

describe("getShareInfo", () => {
  it("returns ShareInfo on 200", async () => {
    const mockShareInfo = {
      hash: "abc123",
      title: "My Share",
      bannerUrl: "",
      viewMode: "list",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockShareInfo),
    } as Response);

    const result = await getShareInfo("abc123");
    expect(result).toEqual(mockShareInfo);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/public/api/share/info?hash=abc123",
      { credentials: "same-origin" }
    );
  });

  it("throws on 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Share not found" }),
    } as Response);

    await expect(getShareInfo("nonexistent")).rejects.toMatchObject({ status: 404 });
  });

  it("throws on 403 expired", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: () => Promise.resolve({ message: "Share has expired" }),
    } as Response);

    await expect(getShareInfo("expired")).rejects.toMatchObject({ status: 403 });
  });
});

describe("getShareDownloadURL", () => {
  it("returns correctly constructed URL", () => {
    const url = getShareDownloadURL("abc123", "/folder/file.txt");
    expect(url).toBe("https://example.com/public/api/resources/download?hash=abc123&path=%2Ffolder%2Ffile.txt");
  });
});

describe("getShareItems", () => {
  it("returns items on 200", async () => {
    const mockItems = {
      files: [{ name: "file.txt" }],
      folders: [{ name: "sub" }],
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockItems),
    } as Response);

    const result = await getShareItems("abc123");
    expect(result).toEqual(mockItems);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/public/api/resources/items?hash=abc123&path=%2F",
      { credentials: "same-origin" }
    );
  });

  it("uses default path /", async () => {
    const mockItems = {
      files: [{ name: "file.txt" }],
      folders: [{ name: "sub" }],
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockItems),
    } as Response);

    await getShareItems("abc123");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/public/api/resources/items?hash=abc123&path=%2F",
      { credentials: "same-origin" }
    );
  });

  it("throws on error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ message: "Internal error" }),
    } as Response);

    await expect(getShareItems("abc123")).rejects.toMatchObject({ status: 500 });
  });
});
