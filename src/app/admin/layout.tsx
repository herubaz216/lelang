import { requireStaff } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStaff();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar profile={profile} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
