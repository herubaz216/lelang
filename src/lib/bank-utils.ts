export function getBankName(account: {
  banks?: { name: string } | null;
}) {
  return account.banks?.name ?? "Bank";
}
