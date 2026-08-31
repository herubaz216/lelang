import { requireStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStaff();

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
