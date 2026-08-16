import { WineryForm } from "@/components/admin/WineryForm";
import { createWineryAction } from "@/app/admin/wineries/actions";

export default function NewWineryPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-serif-display text-2xl text-[var(--color-charcoal)]">Add Winery</h1>
      <p className="mt-1 mb-6 text-sm text-[var(--color-charcoal)]/55">
        New stops appear automatically in the app once marked active — no deploy required.
      </p>
      <WineryForm action={createWineryAction} />
    </div>
  );
}
