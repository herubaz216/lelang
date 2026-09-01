import { requireStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCompanyProvider } from "@/components/admin/admin-company-context";
import { fetchCompanyById } from "@/lib/companies";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStaff();
  const company = await fetchCompanyById(profile.company_id);

  return (
    <AdminCompanyProvider companyId={profile.company_id}>
      <AdminShell profile={profile} companyName={company?.short_name ?? "Admin"}>
        {children}
      </AdminShell>
    </AdminCompanyProvider>
  );
}
