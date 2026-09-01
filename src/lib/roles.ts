import { UserRole } from "@/lib/database.types";

export const STAFF_ROLES: UserRole[] = ["ga", "accounting", "ga_accounting"];
export const ACCOUNTING_ROLES: UserRole[] = ["accounting", "ga_accounting"];

export function isStaffRole(role: string | null | undefined): role is UserRole {
  return STAFF_ROLES.includes(role as UserRole);
}

export function canEditPricing(role: string | null | undefined): boolean {
  return ACCOUNTING_ROLES.includes(role as UserRole);
}

export function canManageRekening(role: string | null | undefined): boolean {
  return ACCOUNTING_ROLES.includes(role as UserRole);
}
