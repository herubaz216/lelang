type EmployeeApiPayload = Record<string, unknown>;

export type EmployeeLookupResult =
  | { ok: true; nomorInduk: string; fullName: string }
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

function readString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value).trim();
  }
  return "";
}

function pickName(source: EmployeeApiPayload): string {
  for (const key of NAME_KEYS) {
    const value = readString(source[key]);
    if (value) return value;
  }
  return "";
}

function pickNik(source: EmployeeApiPayload): string {
  for (const key of NIK_KEYS) {
    const value = readString(source[key]);
    if (value) return value;
  }
  return "";
}

function extractEmployee(
  payload: unknown,
  fallbackNik: string
): { nomorInduk: string; fullName: string } | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as EmployeeApiPayload;
  const nested =
    root.transactionData && typeof root.transactionData === "object"
      ? (root.transactionData as EmployeeApiPayload)
      : root.data && typeof root.data === "object"
        ? (root.data as EmployeeApiPayload)
        : null;

  const fullName = pickName(nested ?? {}) || pickName(root);
  if (!fullName) return null;

  const nomorInduk =
    pickNik(nested ?? {}) || pickNik(root) || fallbackNik.trim();

  return { nomorInduk, fullName };
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

  const employee = extractEmployee(body, nik);
  if (!employee) {
    return {
      ok: false,
      error: "Data karyawan tidak lengkap dari server",
      status: 404,
    };
  }

  return {
    ok: true,
    nomorInduk: employee.nomorInduk,
    fullName: employee.fullName,
  };
}
