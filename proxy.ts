import { NextResponse, type NextRequest } from "next/server";

// An invitation's own link (e.g. faisal-khadija-invitation.vercel.app, or a custom domain)
// serves that invitation at "/". The main site and Vercel's deployment URLs are left alone.
export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const dedicated = host.endsWith("-invitation.vercel.app") || (!host.endsWith(".vercel.app") && host !== "localhost" && !/^[\d.]+$/.test(host));
  if (!dedicated) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/d/${host}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/"] };
