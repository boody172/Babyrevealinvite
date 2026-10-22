import { NextResponse } from "next/server";
import { admin, ApiError } from "@/lib/api";

// Gives an invitation its own *.vercel.app link by adding a domain to this Vercel project.
// Needs a VERCEL_TOKEN env var (Vercel → Account Settings → Tokens); project/team ids are not secret.
const PROJECT = process.env.VERCEL_PROJECT_ID_OVERRIDE || "prj_XbtvzoRZgfuZAwLhcO2ArSXKLAgp";
const TEAM = process.env.VERCEL_TEAM_ID_OVERRIDE || "team_Yz7sm7lEfAvSHskVYM41gXQe";
const SLUG = /^[a-z0-9][a-z0-9-]{1,39}$/;

export async function POST(req: Request) {
  const { token, id, slug } = (await req.json().catch(() => ({}))) as { token?: string; id?: string; slug?: string };
  if (!token || !id || !slug || !SLUG.test(slug)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  try {
    await admin.whoami(token);
  } catch (e) {
    return NextResponse.json({ error: e instanceof ApiError ? e.message : "unauthorized" }, { status: 401 });
  }

  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) return NextResponse.json({ error: "not_configured" }, { status: 501 });

  const domain = `${slug}-invitation.vercel.app`;
  const res = await fetch(`https://api.vercel.com/v10/projects/${PROJECT}/domains?teamId=${TEAM}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain }),
  });
  if (!res.ok) {
    // fine if this project already has it (an earlier attempt); otherwise the name is taken
    const mine = await fetch(`https://api.vercel.com/v9/projects/${PROJECT}/domains/${domain}?teamId=${TEAM}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    });
    if (!mine.ok) return NextResponse.json({ error: "domain_taken" }, { status: 409 });
  }

  await admin.setDomain(token, id, domain);
  return NextResponse.json({ domain });
}
