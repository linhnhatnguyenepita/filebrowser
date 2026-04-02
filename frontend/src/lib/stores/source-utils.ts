import { apiFetch } from "@/lib/api/client";
import { getSources } from "@/lib/api/settings";

export async function getDefaultSource(): Promise<string> {
  try {
    const sources = await getSources();
    const names = Object.keys(sources);
    if (names.length > 0) {
      return names[0];
    }
  } catch {
    // fall through to empty string
  }
  return "";
}
