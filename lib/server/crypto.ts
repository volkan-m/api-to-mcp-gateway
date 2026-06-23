import crypto from "crypto";
import { AppError } from "./errors";

// AES-256-CBC encryption. EXACTLY compatible with C# `EncryptionService`:
//  - Key: ENCRYPTION_KEY env var, padded to 32 chars with spaces (PadRight)
//    and first 32 characters taken as UTF-8 (Substring(0,32)).
//  - Output format: "HEX(iv):HEX(ciphertext)" (C# Convert.ToHexString -> UPPERCASE).
//
// This compatibility is critical: existing keyValue records in the database were
// encrypted with C# and must be decryptable with these functions.

const ALGORITHM = "aes-256-cbc";
const DEFAULT_KEY = "default_encryption_key_32_chars_!!";

function deriveKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
  // C#: keyString.PadRight(32).Substring(0, 32)
  const padded = keyString.length < 32 ? keyString.padEnd(32, " ") : keyString;
  return Buffer.from(padded.substring(0, 32), "utf8");
}

export function encrypt(plaintext: string): string {
  if (plaintext === undefined || plaintext === null) {
    throw new AppError("VALIDATION_ERROR", "encrypt: plaintext zorunludur");
  }

  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return `${iv.toString("hex").toUpperCase()}:${encrypted
    .toString("hex")
    .toUpperCase()}`;
}

export function decrypt(encrypted: string): string {
  const parts = (encrypted ?? "").split(":");
  if (parts.length !== 2) {
    throw new AppError("INVALID_CIPHER", "Geçersiz şifreli metin formatı");
  }

  try {
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, deriveKey(), iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new AppError("INVALID_CIPHER", "Credential çözülemedi");
  }
}

// Helper for masking credential values in listings/responses.
export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
}
