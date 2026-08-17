import { NextResponse } from "next/server";
import { isCurrentUserAdmin, getAllMembersAdmin } from "@/lib/admin";

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const members = await getAllMembersAdmin();

  const rows = [
    ["Name", "Email", "Signed Up"],
    ...members.map((m) => [
      m.name ?? "",
      m.email ?? "",
      new Date(m.created_at).toISOString().slice(0, 10),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvField).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tn-wine-passport-members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
