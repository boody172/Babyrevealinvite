import InvitePage, { inviteMetadata } from "@/components/invite/InvitePage";

export const dynamic = "force-dynamic";

export const generateMetadata = () => inviteMetadata({ slug: null });

export default async function Home({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  return <InvitePage by={{ slug: null }} preview={(await searchParams).preview === "1"} />;
}
