import { Suspense } from "react";
import LupaPasswordForm from "./lupa-password-form";

export default function LupaPasswordPage() {
  return (
    <Suspense>
      <LupaPasswordForm />
    </Suspense>
  );
}
