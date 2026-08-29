import type { Metadata } from "next";
import { DashboardContent } from "./dashboard-content";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = { title: "Dashboard", description: "Your PDFForge usage overview." };

export default function DashboardPage() {
  return (
    <RequireAuth page="The dashboard">
      <DashboardContent />
    </RequireAuth>
  );
}
