import { Sidebar } from "@/components/sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
    </>
  );
}
