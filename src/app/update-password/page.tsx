import { Suspense } from "react";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
}
