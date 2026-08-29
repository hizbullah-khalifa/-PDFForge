import type { Metadata } from "next";
import { SignWorkspace } from "@/components/signature/sign-workspace";

export const metadata: Metadata = {
  title: "Add Signature to PDF — Draw, Type or Upload",
  description:
    "Sign PDF documents online. Draw your signature, type it in a handwriting style or upload an image, then place it anywhere and download.",
};

export default function SignPage() {
  return (
    <div className="container-p py-10">
      <header className="mb-7 text-center">
        <p className="kicker">SIGNING WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Add Signature</h1>
        <p className="mx-auto mt-2 max-w-lg text-slate-500 dark:text-slate-400">
          Create a reusable signature once — draw, type or upload — then stamp it on any page.
        </p>
      </header>
      <SignWorkspace />
    </div>
  );
}
