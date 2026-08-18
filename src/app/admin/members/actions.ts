"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export async function setSubscriberAction(userId: string, isSubscriber: boolean) {
  if (!(await isCurrentUserAdmin())) throw new Error("Not authorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_subscriber: isSubscriber })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/members");
  revalidatePath("/");
}
