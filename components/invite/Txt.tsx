/**
 * A piece of text the admin can click to edit in the dashboard preview.
 * k: "c:<content field>" (per-language invitation text) or "l:<ui label>" (button, heading…).
 */
export function Txt({ k, children, className }: { k: string; children: React.ReactNode; className?: string }) {
  return (
    <span data-edit={k} className={className}>
      {children}
    </span>
  );
}
