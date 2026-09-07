import { NextResponse } from "next/server";
import { getWineryStaffContext, getWineryGuestList } from "@/lib/portal";

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const ctx = await getWineryStaffContext();
  if (!ctx) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const guests = await getWineryGuestList(ctx.winery.id);

  const rows = [
    ["Name", "Email", "Visits", "First Visit", "Last Visit"],
    ...guests.map((g) => [g.name ?? "", g.email ?? "", String(g.visitCount), g.firstVisit, g.lastVisit]),
  ];
  const csv = rows.map((row) => row.map(csvField).join(",")).join("\n");

  const filenameSafeSlug = ctx.winery.slug.replace(/[^a-z0-9-]/gi, "");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameSafeSlug}-guests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
