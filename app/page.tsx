import Invitation from "@/components/invite/Invitation";
import { getSite } from "@/lib/api";
import type { SiteData } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(): Promise<SiteData | null> {
  try {
    return await getSite(null, { signal: AbortSignal.timeout(4000) });
  } catch {
    return null;
  }
}

export default async function Page() {
  const data = await load();
  return <Invitation initial={data} />;
}
