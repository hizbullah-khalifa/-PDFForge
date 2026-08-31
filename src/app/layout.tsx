import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfforge.app"),
  title: {
    default: "PDFForge — Every PDF Tool. One Powerful Workspace.",
    template: "%s | PDFForge",
  },
  description:
    "Convert, compress, merge, edit, protect, and manage your documents in seconds. Work Smarter With Every PDF.By Hizbullah Khalifa",
};

const themeInit = `(function(){try{var t=localStorage.getItem('pf-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
