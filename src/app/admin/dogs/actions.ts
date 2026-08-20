"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export type DogActionResult = { error: string } | void;

export async function updateDogAction(dogId: string, formData: FormData): Promise<DogActionResult> {
  if (!(await isCurrentUserAdmin())) return { error: "Not authorized" };

  const photo = String(formData.get("photo") ?? "").trim();

  const dog = {
    name: String(formData.get("name") ?? "").trim(),
    photo: photo || null,
    breed: String(formData.get("breed") ?? "").trim() || null,
    age: String(formData.get("age") ?? "").trim() || null,
    weight: String(formData.get("weight") ?? "").trim() || null,
    food: String(formData.get("food") ?? "").trim() || null,
    medication: String(formData.get("medication") ?? "").trim() || null,
    allergies: String(formData.get("allergies") ?? "").trim() || null,
    vet_name: String(formData.get("vet_name") ?? "").trim() || null,
    vet_phone: String(formData.get("vet_phone") ?? "").trim() || null,
    emergency_contact_name: String(formData.get("emergency_contact_name") ?? "").trim() || null,
    emergency_contact_phone: String(formData.get("emergency_contact_phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (!dog.name) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("dogs").update(dog).eq("id", dogId);
  if (error) return { error: error.message };

  revalidatePath("/admin/dogs");
  revalidatePath(`/admin/dogs/${dogId}`);
  revalidatePath("/dog-sitter");
}
