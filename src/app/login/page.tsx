import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in", description: "Log in to your PDFForge account." };

export default function LoginPage() {
  return (
    <div className="container-p flex justify-center py-16">
      <AuthForm mode="login" />
    </div>
  );
}
