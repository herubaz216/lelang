import { Company } from "@/lib/database.types";

export const DEFAULT_COMPANY_CODE = "ams";

export function resolveCompanyCode(
  code: string | undefined,
  companies: Company[]
): string {
  if (code && companies.some((company) => company.code === code.toLowerCase())) {
    return code.toLowerCase();
  }
  return companies[0]?.code ?? DEFAULT_COMPANY_CODE;
}

export function withCompanyQuery(path: string, companyCode: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}company=${companyCode}`;
}
