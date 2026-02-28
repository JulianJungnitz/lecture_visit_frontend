import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lecture Visit App",
  description: "Internal tool for coordinating lecture visits at LMU and TUM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar />
          <div className="ml-56 min-h-screen flex flex-col">
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-6 py-3">
              <Suspense>
                <Breadcrumbs />
              </Suspense>
            </header>
            <main className="flex-1 px-6 py-6">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
