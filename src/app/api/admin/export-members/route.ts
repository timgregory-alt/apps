import { NextResponse } from "next/server";
import { isCurrentUserAdmin, getAllMembersAdmin, cityFromZip } from "@/lib/admin";

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
    ["Name", "Email", "Zip Code", "City", "Terms Agreed At", "Signed Up"],
    ...members.map((m) => [
      m.name ?? "",
      m.email ?? "",
      m.zip_code ?? "",
      cityFromZip(m.zip_code) ?? "",
      m.agreed_to_terms_at ? new Date(m.agreed_to_terms_at).toISOString().slice(0, 10) : "",
      new Date(m.created_at).toISOString().slice(0, 10),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvField).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tn-wine-trails-members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
