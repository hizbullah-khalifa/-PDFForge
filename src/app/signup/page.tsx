import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign up free", description: "Create your free PDFForge account." };

export default function SignupPage() {
  return (
    <div className="container-p flex justify-center py-16">
      <AuthForm mode="signup" />
    </div>
  );
}
