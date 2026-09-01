import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { fetchCompanyById } from "@/lib/companies";
import { AllUsersPanel } from "@/components/admin/all-users-panel";

export default async function AllUsersPage() {
  const profile = await requireStaff();
  const company = await fetchCompanyById(profile.company_id);

  if (company?.code !== "ams") {
    redirect("/admin");
  }

  return <AllUsersPanel />;
}
