"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
