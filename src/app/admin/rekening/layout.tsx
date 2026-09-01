import { requireStaff } from "@/lib/auth";

export default async function RekeningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff(["accounting"]);
  return children;
}
