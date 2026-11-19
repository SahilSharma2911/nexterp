import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "nexterp",
  description: "A generic ERP (ERPNext-modeled) on Next.js",
};

// Set the saved accent before paint to avoid a flash of the wrong colour.
const accentScript = `try{var a=localStorage.getItem('accent')||'clay';if(a&&a!=='neutral')document.documentElement.setAttribute('data-accent',a);}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", inter.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
