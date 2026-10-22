import InvitePage, { inviteMetadata } from "@/components/invite/InvitePage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };

export async function generateMetadata({ params }: Props) {
  return inviteMetadata({ slug: (await params).slug });
}

export default async function InvitationBySlug({ params, searchParams }: Props) {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  return <InvitePage by={{ slug }} preview={preview === "1"} />;
}
