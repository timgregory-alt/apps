"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShareSheet } from "@/components/share/ShareSheet";

export function CompletionShareButton({ wineryNames }: { wineryNames: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="gold" size="lg" fullWidth onClick={() => setOpen(true)}>
        <Share2 size={18} strokeWidth={2} />
        Share Your Completion
      </Button>
      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        wineryId={null}
        headline="I COMPLETED THE TENNESSEE WINE PASSPORT"
        subheadline="4 / 4 COMPLETE"
        checklist={wineryNames}
        visited={wineryNames.length}
        total={wineryNames.length}
        shareUrl="https://tennesseewinepassport.com"
      />
    </>
  );
}
