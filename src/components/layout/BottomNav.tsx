"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, Compass, Map, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/passport", label: "Passport", icon: BookMarked },
  { href: "/map", label: "Map", icon: Map },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-ivory)]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[0.68rem] font-medium tracking-wide"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.5}
                  className={cn(
                    "transition-colors duration-200",
                    active ? "text-[var(--color-burgundy)]" : "text-[var(--color-charcoal)]/45"
                  )}
                />
                <span
                  className={cn(
                    "transition-colors duration-200",
                    active ? "text-[var(--color-burgundy)]" : "text-[var(--color-charcoal)]/45"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
