// C# EncryptionService ile BİREBİR aynı algoritmayla (AES-256-CBC,
// key = ENCRYPTION_KEY.PadRight(32).Substring(0,32) UTF-8,
// çıktı = HEX(iv):HEX(ciphertext) BÜYÜK harf) sabit IV kullanarak
// deterministik uyum vektörleri üretir.
//
// Bu script TS `encrypt()` fonksiyonundan BAĞIMSIZDIR (rastgele IV yerine
// sabit IV kullanır), böylece üretilen değerler "dışarıdan (C#) gelmiş gibi"
// kabul edilebilir ve `decrypt()` testinin gerçek bir uyum kanıtı olmasını sağlar.
//
// Çalıştırma: node test/fixtures/generate-vectors.mjs

import crypto from "crypto";

function deriveKey(keyString) {
  const padded = keyString.length < 32 ? keyString.padEnd(32, " ") : keyString;
  return Buffer.from(padded.substring(0, 32), "utf8");
}

function csharpEncrypt(keyString, plaintext, ivHex) {
  const key = deriveKey(keyString);
  const iv = Buffer.from(ivHex, "hex");
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("hex").toUpperCase()}:${encrypted
    .toString("hex")
    .toUpperCase()}`;
}

const DEFAULT_KEY = "default_encryption_key_32_chars_!!";
const CUSTOM_KEY = "my-prod-secret-key-value-123456789";

const cases = [
  { key: DEFAULT_KEY, plaintext: "Bearer abc123", iv: "00112233445566778899AABBCCDDEEFF" },
  { key: DEFAULT_KEY, plaintext: "sk-test-0000000000000000", iv: "0F0E0D0C0B0A09080706050403020100" },
  { key: DEFAULT_KEY, plaintext: "", iv: "112233445566778899AABBCCDDEEFF00" },
  { key: DEFAULT_KEY, plaintext: "üğşçöÜĞŞÇÖ-türkçe", iv: "A1B2C3D4E5F60718293A4B5C6D7E8F90" },
  { key: CUSTOM_KEY, plaintext: "X-Api-Key-Value-998877", iv: "FFEEDDCCBBAA99887766554433221100" },
];

for (const c of cases) {
  console.log(
    JSON.stringify({
      key: c.key,
      plaintext: c.plaintext,
      encrypted: csharpEncrypt(c.key, c.plaintext, c.iv),
    }),
  );
}
