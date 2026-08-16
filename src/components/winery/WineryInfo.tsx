import { Clock, Globe, MapPin } from "lucide-react";
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

export function WineryDetailsList({ winery }: { winery: Winery }) {
  return (
    <dl className="flex flex-col divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-white/60">
      <Row icon={MapPin} label="Address" value={winery.address} />
      <Row icon={Clock} label="Hours" value={winery.hours ?? "Hours coming soon"} />
      {winery.phone && <Row icon={Clock} label="Phone" value={winery.phone} />}
    </dl>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <Icon size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
      <div className="min-w-0">
        <dt className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--color-charcoal)]/45">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-[var(--color-charcoal)]/85">{value}</dd>
      </div>
    </div>
  );
}

export function WinerySocialRow({ winery }: { winery: Winery }) {
  const links = [
    winery.website_url && { href: winery.website_url, icon: Globe, label: "Website" },
    winery.instagram_url && { href: winery.instagram_url, icon: InstagramIcon, label: "Instagram" },
    winery.facebook_url && { href: winery.facebook_url, icon: FacebookIcon, label: "Facebook" },
  ].filter((l): l is { href: string; icon: typeof Globe; label: string } => !!l);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
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
