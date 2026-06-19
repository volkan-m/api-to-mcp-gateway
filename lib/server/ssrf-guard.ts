import dns from "dns/promises";
import net from "net";

// SSRF koruması. C# `SsrfProtectionService` davranışını taşır:
//  - Yalnızca mutlak http/https URL'ler kabul edilir.
//  - Host'un çözümlenen TÜM IP adresleri public ise true; herhangi biri
//    private/loopback/link-local ise false.
//  - Geçersiz URL veya DNS hatası -> false (fail-closed).

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;

  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local
  if (a === 0) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower === "::") return true;
  return false;
}

function isPrivateIp(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 4) return isPrivateIPv4(ip);
  if (type === 6) return isPrivateIPv6(ip);
  return true; // tanınmayan -> güvenli tarafta kal
}

export async function isSafeUrl(url: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  try {
    const records = await dns.lookup(parsed.hostname, { all: true });
    if (records.length === 0) return false;
    for (const record of records) {
      if (isPrivateIp(record.address)) return false;
    }
    return true;
  } catch {
    return false;
  }
}
