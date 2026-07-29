import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { AdminProvider, useAdmin } from "@/lib/admin-store";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_admin")({
  component: () => (
    <AdminProvider>
      <AdminGate />
    </AdminProvider>
  ),
});

function AdminGate() {
  const { adminUser, authChecked, checkAdminAuth } = useAdmin();
  const nav = useNavigate();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (authChecked && !adminUser) {
      nav({ to: "/login" });
    }
  }, [authChecked, adminUser]);

  if (!authChecked) {
    return (
      <div className="h-screen w-full grid place-items-center text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return <AdminLayout />;
}

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <AdminSidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar onToggle={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}