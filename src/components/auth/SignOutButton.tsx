"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** `variant="button"` (default) renders the full pill button used on the
 * Profile page. `variant="link"` renders an unstyled trigger that takes
 * `className` directly, for dropping into a plain text nav bar (e.g. the
 * portal header) alongside other nav links. */
export function SignOutButton({
  variant = "button",
  className,
}: {
  variant?: "button" | "link";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className={cn("disabled:opacity-50", className)}
      >
        {loading ? "Signing out…" : "Sign Out"}
      </button>
    );
  }

  return (
    <Button variant="outline" fullWidth onClick={handleSignOut} disabled={loading}>
      <LogOut size={16} strokeWidth={2} />
      {loading ? "Signing out…" : "Sign Out"}
    </Button>
  );
}
