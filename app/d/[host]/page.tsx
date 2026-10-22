import InvitePage, { inviteMetadata } from "@/components/invite/InvitePage";

// Reached through proxy.ts when an invitation is opened on its own link.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ host: string }>; searchParams: Promise<{ preview?: string }> };

export async function generateMetadata({ params }: Props) {
  return inviteMetadata({ domain: (await params).host });
}

export default async function InvitationByDomain({ params, searchParams }: Props) {
  const [{ host }, { preview }] = await Promise.all([params, searchParams]);
  return <InvitePage by={{ domain: host }} preview={preview === "1"} />;
}
