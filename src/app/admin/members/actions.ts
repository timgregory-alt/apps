"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export async function setSubscriberAction(
  userId: string,
  isSubscriber: boolean
): Promise<{ error: string } | void> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_subscriber: isSubscriber })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  revalidatePath("/");
}

/** Permanently removes a member's account — deleting the auth user cascades
 * through every table that references it (check-ins, ratings, redemptions,
 * etc. all have ON DELETE CASCADE), same as the guest-facing "Delete
 * Account" flow, just triggered by an admin instead of the guest
 * themselves. */
export async function removeMemberAction(userId: string): Promise<{ error: string } | void> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const adminClient = await createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  revalidatePath("/admin");
}
