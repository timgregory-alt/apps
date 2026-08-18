import { InstagramIcon, FacebookIcon } from "@/components/ui/BrandIcons";
import type { Winery } from "@/lib/types";

export function WineryDescription({ winery }: { winery: Winery }) {
  return (
    <div>
      <p className="text-[1.05rem] leading-relaxed text-[var(--color-charcoal)]/80">
        {winery.description}
      </p>
    </div>
  );
}

export function WinerySocialRow({ winery }: { winery: Winery }) {
  const links = [
    winery.instagram_url && { href: winery.instagram_url, icon: InstagramIcon, label: "Instagram" },
    winery.facebook_url && { href: winery.facebook_url, icon: FacebookIcon, label: "Facebook" },
  ].filter((l): l is { href: string; icon: typeof InstagramIcon; label: string } => !!l);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      {links.map(({ href, icon: Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-charcoal)]/70 transition-colors hover:border-[var(--color-gold)] hover:text-[var(--color-burgundy)]"
        >
          <Icon size={18} strokeWidth={1.75} />
        </a>
      ))}
    </div>
  );
}
