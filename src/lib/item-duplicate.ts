/** Nama hasil duplikasi: "Mug" → "Mug 2", "Mug 2" → "Mug 3". */
export function nextDuplicateItemName(name: string): string {
  const trimmed = name.trim();
  const match = trimmed.match(/^(.*?)(?:\s+)(\d+)$/);
  if (match) {
    const base = match[1].trimEnd();
    const next = Number(match[2]) + 1;
    return `${base} ${next}`;
  }
  return `${trimmed} 2`;
}
