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
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)] px-6 py-3">
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
