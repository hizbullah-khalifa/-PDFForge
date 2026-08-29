import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Forgot password", description: "Reset your PDFForge password." };

export default function ForgotPasswordPage() {
  return (
    <div className="container-p flex justify-center py-16">
      <AuthForm mode="forgot" />
    </div>
  );
}
