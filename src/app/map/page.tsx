import { getCurrentUser, getWineriesWithStatus } from "@/lib/data";
import { Header } from "@/components/layout/Header";
import { LinkButton } from "@/components/ui/Button";
import { TrailMap } from "@/components/map/TrailMap";

export default async function MapPage() {
  const user = await getCurrentUser();
  const wineries = await getWineriesWithStatus(user?.id ?? null);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 pb-6">
      <Header eyebrow="Founding Trail" title="The Wine Trail Map" className="pb-4" />

      <TrailMap wineries={wineries} />

      <div className="px-6">
        <LinkButton href="/trail/plan" variant="primary" size="lg" fullWidth>
          Plan My Wine Trail
        </LinkButton>
      </div>
    </main>
  );
}
