import { requireStaff } from "@/lib/auth";
import { ACCOUNTING_ROLES } from "@/lib/roles";

export default async function RekeningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff(ACCOUNTING_ROLES);
  return children;
}
