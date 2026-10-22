import InvitePage, { inviteMetadata } from "@/components/invite/InvitePage";

export const dynamic = "force-dynamic";

export const generateMetadata = () => inviteMetadata(null);

export default async function Home({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  return <InvitePage slug={null} preview={(await searchParams).preview === "1"} />;
}
