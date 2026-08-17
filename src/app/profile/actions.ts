"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";

const MIN_AGE = 21;

export async function updateProfileAction(input: { name: string; birth_date: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to update your profile");

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  if (input.birth_date && calculateAge(input.birth_date) < MIN_AGE) {
    throw new Error(`You must be ${MIN_AGE} or older.`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name, birth_date: input.birth_date || null })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}
