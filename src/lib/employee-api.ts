type EmployeeApiPayload = Record<string, unknown>;

export type EmployeeMatch = {
  nomorInduk: string;
  fullName: string;
  pt: string;
};

export type EmployeeLookupResult =
  | { ok: true; nomorInduk: string; fullName: string; pt: string; matches: EmployeeMatch[] }
  | { ok: false; error: string; status?: number };

const NAME_KEYS = [
  "NamaLengkapStr",
  "nama",
  "nama_lengkap",
  "namaLengkap",
  "fullName",
  "full_name",
  "employee_name",
  "employeeName",
  "name",
];

const NIK_KEYS = [
  "NomorIndukStr",
  "nomor_induk",
  "nomorInduk",
  "nik",
  "employee_nik",
  "employeeNik",
];

const PT_KEYS = ["pt", "PT", "company", "company_name", "companyName", "nama_pt"];

function readString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value).trim();
  }
  return "";
}

function parsePossiblyJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function asRecord(value: unknown): EmployeeApiPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as EmployeeApiPayload;
}

function pickByKeys(source: EmployeeApiPayload, keys: string[]): string {
  for (const key of keys) {
    const value = readString(source[key]);
    if (value) return value;
  }

  // Case-insensitive fallback for SP field naming quirks.
  const entries = Object.entries(source);
  for (const key of keys) {
    const lower = key.toLowerCase();
    for (const [actualKey, raw] of entries) {
      if (actualKey.toLowerCase() !== lower) continue;
      const value = readString(raw);
      if (value) return value;
    }
  }
  return "";
}

function pickName(source: EmployeeApiPayload): string {
  return pickByKeys(source, NAME_KEYS);
}

function pickNik(source: EmployeeApiPayload): string {
  return pickByKeys(source, NIK_KEYS);
}

function pickPt(source: EmployeeApiPayload): string {
  return pickByKeys(source, PT_KEYS);
}

function extractMatchFromRow(
  row: unknown,
  fallbackNik: string
): EmployeeMatch | null {
  const source = asRecord(parsePossiblyJson(row));
  if (!source) return null;

  const fullName = pickName(source);
  if (!fullName) return null;

  return {
    nomorInduk: pickNik(source) || fallbackNik.trim(),
    fullName,
    pt: pickPt(source),
  };
}

function collectRows(raw: unknown): unknown[] {
  const parsed = parsePossiblyJson(raw);

  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const record = parsed as EmployeeApiPayload;
    // Nested wrappers sometimes used by SP/API middleware.
    const nested =
      record.transactionData ??
      record.data ??
      record.rows ??
      record.items ??
      record.result;
    if (nested != null && nested !== parsed) {
      return collectRows(nested);
    }
    return [parsed];
  }
  return [];
}

/** Ambil semua kandidat karyawan dari respons API (object tunggal atau array). */
export function extractEmployeeMatches(
  payload: unknown,
  fallbackNik: string
): EmployeeMatch[] {
  const rootPayload = parsePossiblyJson(payload);
  if (!rootPayload || typeof rootPayload !== "object") return [];

  const root = rootPayload as EmployeeApiPayload;
  const raw = root.transactionData ?? root.data ?? root;
  const rows = collectRows(raw);

  const matches: EmployeeMatch[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const match = extractMatchFromRow(row, fallbackNik);
    if (!match) continue;

    const key = `${match.pt.toLowerCase()}|${match.nomorInduk}|${match.fullName.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push(match);
  }

  // Fallback: nama di root tanpa nested transactionData
  if (matches.length === 0) {
    const rootMatch = extractMatchFromRow(root, fallbackNik);
    if (rootMatch) matches.push(rootMatch);
  }

  return matches;
}

export function pickEmployeeMatch(
  matches: EmployeeMatch[],
  options?: { fullName?: string; pt?: string }
): EmployeeMatch | null {
  if (matches.length === 0) return null;

  const fullName = options?.fullName?.trim() ?? "";
  const pt = options?.pt?.trim() ?? "";

  if (pt && fullName) {
    const exact = matches.find(
      (match) =>
        match.pt.toLowerCase() === pt.toLowerCase() &&
        match.fullName === fullName
    );
    if (exact) return exact;
  }

  if (pt) {
    const byPt = matches.find(
      (match) => match.pt.toLowerCase() === pt.toLowerCase()
    );
    if (byPt) return byPt;
  }

  if (fullName) {
    const byName = matches.filter((match) => match.fullName === fullName);
    if (byName.length === 1) return byName[0];
    if (byName.length > 1) return null;
  }

  if (matches.length === 1) return matches[0];
  return null;
}

function getEmployeeApiConfig() {
  const baseUrl =
    process.env.EMPLOYEE_API_BASE_URL?.trim() ||
    "https://golangapi-j5iu.onrender.com";
  const apiKey = process.env.EMPLOYEE_API_KEY?.trim() ?? "";

  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

export async function fetchEmployeeByNik(
  nomorInduk: string
): Promise<EmployeeLookupResult> {
  const nik = nomorInduk.trim();
  if (!nik) {
    return { ok: false, error: "NIK wajib diisi" };
  }

  const { baseUrl, apiKey } = getEmployeeApiConfig();
  if (!apiKey) {
    return { ok: false, error: "Konfigurasi API karyawan belum tersedia" };
  }

  const url = new URL("/api/v1/employee/by-nik", baseUrl);
  url.searchParams.set("nomor_induk", nik);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Gagal menghubungi server karyawan" };
  }

  const rawText = await response.text();
  let payload: unknown = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      return {
        ok: false,
        error: "Respons server karyawan tidak valid",
        status: response.status,
      };
    }
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "responseMessage" in payload
        ? readString((payload as EmployeeApiPayload).responseMessage)
        : "";

    return {
      ok: false,
      error: message || "NIK tidak ditemukan",
      status: response.status,
    };
  }

  const body = (payload ?? {}) as EmployeeApiPayload;
  const responseCode = readString(body.responseCode);

  if (responseCode && responseCode !== "2002500") {
    return {
      ok: false,
      error:
        readString(body.responseMessage) || "NIK tidak ditemukan atau tidak aktif",
      status: 404,
    };
  }

  const matches = extractEmployeeMatches(body, nik);
  if (matches.length === 0) {
    return {
      ok: false,
      error: "Data karyawan tidak lengkap dari server",
      status: 404,
    };
  }

  const primary = matches[0];
  return {
    ok: true,
    nomorInduk: primary.nomorInduk,
    fullName: primary.fullName,
    pt: primary.pt,
    matches,
  };
}
